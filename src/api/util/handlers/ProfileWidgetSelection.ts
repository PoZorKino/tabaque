import { Application, ProfileWidget, User } from "@spacebar/database";
import { Config, FieldErrors, Snowflake } from "@spacebar/util";
import { canUseWidget, isWidgetComplete } from "@spacebar/api/util/handlers/ApplicationWidgets";
type StoredImage = { file_id: string; width: number; height: number; is_animated: boolean };

// a freshly uploaded image arrives as {filename, original_hash}; turn it into what's stored and rendered, {file_id, width, height, is_animated}
async function claimImage(user_id: string, image: Record<string, unknown>, invalid: (message?: string) => Error): Promise<StoredImage> {
    if (typeof image.file_id === "string") {
        if (!/^[0-9a-f]{32}$/.test(image.file_id)) throw invalid("Invalid image.");
        return { file_id: image.file_id, width: Number(image.width) || 0, height: Number(image.height) || 0, is_animated: !!image.is_animated };
    }
    const match = typeof image.filename === "string" ? /^(\d{1,32})\/([0-9a-f]{32})$/.exec(image.filename) : null;
    if (!match || match[1] !== user_id) throw invalid("Invalid image upload.");
    const res = await fetch(`${Config.get().cdn.endpointPrivate?.replace(/\/+$/, "")}/widget-assets/finalize/${user_id}/${match[2]}`, {
        method: "POST",
        headers: { signature: Config.get().security.requestSignature },
    }).catch(() => null);
    if (!res?.ok) throw invalid("The image upload expired. Upload it again.");
    return (await res.json()) as StoredImage;
}

async function claimImages(user_id: string, node: unknown, invalid: (message?: string) => Error): Promise<unknown> {
    if (Array.isArray(node)) return Promise.all(node.map((x) => claimImages(user_id, x, invalid)));
    if (!node || typeof node !== "object") return node;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node)) {
        if (key === "image" && value && typeof value === "object" && !Array.isArray(value)) out[key] = await claimImage(user_id, value as Record<string, unknown>, invalid);
        else out[key] = await claimImages(user_id, value, invalid);
    }
    return out;
}

const MAX_WIDGETS = 12;
const MAX_WIDGET_SIZE = 16 * 1024;

export async function validateProfileWidgetSelection(user_id: string, widgets: unknown): Promise<ProfileWidget[]> {
    if (!Array.isArray(widgets) || widgets.length > MAX_WIDGETS)
        throw FieldErrors({
            widgets: {
                code: "BASE_TYPE_BAD_LENGTH",
                message: `Must be between 0 and ${MAX_WIDGETS} in length.`,
            },
        });

    const user = await User.findOneOrFail({
        where: { id: user_id },
        select: { id: true, profile_widgets: true },
    });
    const existing = new Set((user.profile_widgets ?? []).map((x) => x.id));
    const next: ProfileWidget[] = await Promise.all(
        widgets.map(async (widget, i) => {
            const { id, data } = (widget ?? {}) as {
                id?: unknown;
                data?: { type?: unknown; application_id?: unknown };
            };
            const invalid = (message = "Invalid widget.") => FieldErrors({ [`widgets.${i}.data`]: { code: "BASE_TYPE_INVALID", message } });
            if (typeof data?.type !== "string" || JSON.stringify(data).length > MAX_WIDGET_SIZE) throw invalid();
            if (data.type === "application") {
                const app =
                    typeof data.application_id === "string" &&
                    (await Application.findOne({
                        where: { id: data.application_id },
                        select: { id: true, owner_id: true, widget_public: true, widget_config: true },
                    }));
                if (!app || !isWidgetComplete(app.widget_config)) throw invalid("This application has no profile widget.");
                if (!(await canUseWidget(app, user_id))) throw invalid("Only the application's owner can add this widget.");
            }
            const widgetData =
                data.type === "application"
                    ? { type: data.type, application_id: data.application_id as string }
                    : ((await claimImages(user_id, data, invalid)) as ProfileWidget["data"]);
            return { id: typeof id === "string" && existing.has(id) ? id : Snowflake.generate(), data: widgetData };
        }),
    );
    if (new Set(next.filter((x) => x.data.type === "application").map((x) => x.data.application_id)).size !== next.filter((x) => x.data.type === "application").length)
        throw FieldErrors({
            widgets: {
                code: "BASE_TYPE_INVALID",
                message: "Each application widget can only be added once.",
            },
        });

    return next;
}
