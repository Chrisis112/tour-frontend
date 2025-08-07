import React, { useState, useEffect } from "react";
import { TFunction } from "i18next";

interface UserRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  recipientId: string;
  orderId: string;
  recipientName: string;
  userId: string;
  alreadyRated?: boolean; // optional flag if user already rated this order
  t: TFunction;
}

const UserRatingModal: React.FC<UserRatingModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  recipientId,
  orderId,
  recipientName,
  alreadyRated = false,
  t,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when it closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setError(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  const handleStarClick = (value: number) => {
    if (!submitting && !alreadyRated) {
      setRating(value);
    }
  };

  const submitRating = async () => {
    if (rating < 1 || rating > 5) {
      setError(t("rating_error_select", "Пожалуйста, выберите рейтинг от 1 до 5"));
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      if (typeof window === "undefined") throw new Error(t("error_unexpected", "Ошибка среды"));
      const token = localStorage.getItem("token");
      if (!token) throw new Error(t("error_unauthorized", "Неавторизован"));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId,
          orderId,
          rating,
          // Note: raterUserId omitted — backend uses token to identify rater
        }),
      });

      if (!response.ok) {
        // Attempt to parse error message from server response
        const errData = await response.json().catch(() => null);
        const message = errData?.error || response.statusText || t("error_sending_review", "Ошибка отправки отзыва");
        throw new Error(message);
      }

      setSubmitting(false);
      onSubmitSuccess();
      onClose();
    } catch (e: unknown) {
      let message = t("error_sending_review", "Ошибка отправки отзыва");
      if (e instanceof Error) {
        message = e.message;
      }
      setError(message);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rating-title"
      onClick={(e) => {
        // Close modal if clicking outside content
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 relative">
        <h2 id="rating-title" className="text-xl font-semibold mb-4">
          {t("rate_user_title", "Оцените пользователя")}: {recipientName}
        </h2>

        {alreadyRated ? (
          <p className="mb-4 text-green-700" role="alert">
            {t("rating_already_done", "Вы уже оценивали этого пользователя по этому заказу.")}
          </p>
        ) : (
          <>
            <div
              className="flex justify-center mb-4 space-x-2"
              role="radiogroup"
              aria-label={t("rating_stars", "Рейтинг звёзд")}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  filled={star <= rating}
                  value={star}
                  onClick={handleStarClick}
                  ariaChecked={rating === star}
                />
              ))}
            </div>
            {error && (
              <div className="mb-4 text-red-600" role="alert" aria-live="assertive">
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border rounded hover:bg-gray-100 focus:outline-none focus:ring"
              >
                {t("cancel", "Отмена")}
              </button>
              <button
                onClick={submitRating}
                disabled={submitting || rating === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring"
              >
                {submitting ? t("submitting", "Отправка...") : t("submit", "Отправить")}
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          aria-label={t("close", "Закрыть")}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold focus:outline-none"
          type="button"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

interface StarProps {
  filled: boolean;
  value: number;
  onClick: (value: number) => void;
  ariaChecked: boolean;
}
const Star: React.FC<StarProps> = ({ filled, value, onClick, ariaChecked }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`text-4xl cursor-pointer leading-none ${
      filled ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
    } focus:outline-none`}
    aria-checked={ariaChecked}
    role="radio"
    aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
    tabIndex={0}
  >
    {filled ? "★" : "☆"}
  </button>
);

export default UserRatingModal;
