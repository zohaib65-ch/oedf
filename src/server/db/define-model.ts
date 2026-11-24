import "server-only";
import mongoose, { type Schema } from "mongoose";

/**
 * Registers a model. Next.js re-evaluates modules during hot reload, and Mongoose throws when a
 * model name is registered twice, so any earlier registration is dropped first.
 * (`mongoose.models` is read from the default import because Node's native ESM cannot see it as a
 * named export of this CommonJS package.)
 */
export function defineModel<TSchema extends Schema>(name: string, schema: TSchema) {
  if (mongoose.models[name]) {
    mongoose.deleteModel(name);
  }
  return mongoose.model(name, schema);
}
