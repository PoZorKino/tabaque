import { Session, User, UserSettings, UserSettingsProtos } from "@spacebar/database";
import { PreloadedUserSettings } from "discord-protos";
import { JsonObject } from "@protobuf-ts/runtime";
import { broadcastPresence } from "@spacebar/util";
import { Not } from "typeorm";
import { UserSettingsUpdateSchema } from "@spacebar/schemas";

export async function updateUserPreferenceSettings(user_id: string, body: UserSettingsUpdateSchema) {
    if (body.locale === "en") body.locale = "en-US";

    const user = await User.findOneOrFail({
        where: { id: user_id, bot: false },
        relations: { settings: true },
    });

    const needsSettingsLink = !user.settings;
    if (!user.settings)
        user.settings = UserSettings.create<UserSettings>({
            ...body,
            friend_source_flags: body.friend_source_flags ?? { all: true },
        });
    else user.settings.assign(body);

    if (body.guild_folders) user.settings.guild_folders = body.guild_folders;

    await user.settings.save();
    if (needsSettingsLink) await User.createQueryBuilder().relation(User, "settings").of(user_id).set(user.settings.index);

    const categories = Object.entries(UserSettings.toProtoCategories(body));
    const proto = await UserSettingsProtos.withLock(user_id, async () => {
        const protos = await UserSettingsProtos.getOrDefault(user_id);
        if (!categories.length) return protos.userSettings;
        const current = PreloadedUserSettings.toJson(protos.userSettings!) as JsonObject;
        for (const [category, values] of categories) current[category] = { ...(current[category] as JsonObject | undefined), ...values };
        return protos.commitUserSettings(PreloadedUserSettings.fromJson(current));
    });
    if (body.status && ["online", "idle", "dnd", "invisible"].includes(body.status)) {
        await Session.update({ user_id: user.id, status: Not("offline") }, { status: body.status });
        await broadcastPresence(user.id, user.toPublicUser());
    }

    return user.settings.toLegacy(proto);
}
