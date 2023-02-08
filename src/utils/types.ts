import { Context, NarrowedContext } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";

export type Ctx = NarrowedContext<Context<Update>, {
  message: Update.New & Update.NonChannel & Message.TextMessage;
  update_id: number;
}>;

export type VoiceCtx = NarrowedContext<Context<Update>, {
  message: Update.New & Update.NonChannel & Message.VoiceMessage;
  update_id: number;
}>;
