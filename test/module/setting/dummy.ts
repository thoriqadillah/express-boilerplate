import { Setting } from "@/app/module/setting/setting.model";
import { v4 } from "uuid";

export const setting: Setting = {
    id: v4(),
    user_id: v4(),
    mail_assigned_notif: true,
    mail_mentioned_notif: true,
    mail_newsletter_notif: true,
    mail_project_details_notif: true,
    mail_promo_notif: true,
    mail_task_status_notif: true,
    mail_tips_notif: true,
    web_assigned_notif: true,
    web_mentioned_notif: true,
    web_newsletter_notif: true,
    web_project_details_notif: true,
    web_promo_notif: true,
    web_task_status_notif: true,
    web_tips_notif: true,
    push_notif: true,
    updated_at: new Date(),
}