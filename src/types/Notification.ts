// frontend/types/Notification.ts

export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  // любые другие свойства, которые есть в уведомлениях
}
