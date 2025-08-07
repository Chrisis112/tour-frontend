import { ReviewSystem } from '../../components/ReviewSystem';

export default function ReviewsPage() {
  return (
    <section className="container mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">Отзывы</h2>
      <ReviewSystem  />
    </section>
  );
}
