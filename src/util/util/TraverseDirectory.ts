import { Server, traverseDirectory } from "lambert-server";
import { Router } from "express";

//if we're using ts-node, use ts files instead of js
const extension = Symbol.for("ts-node.register.instance") in process ? "ts" : "js";

const DEFAULT_FILTER = new RegExp("^([^.].*)(?<!\\.d).(" + extension + ")$");

export function registerRoutes(server: Server, root: string, destRouter: Router | undefined = undefined) {
    return traverseDirectory({ dirname: root, recursive: true, filter: DEFAULT_FILTER }, (file) => server.registerRoute(root, file, destRouter));
}
