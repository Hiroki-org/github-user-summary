type Props = {
  errors: { section: string; message: string }[];
};

export default function ErrorMessages({ errors }: Props) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-2 animate-slide-up">
      {errors.map((err, index) => (
        <div
          key={`${err.section}-${index}`}
          className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <strong>{err.section}:</strong> {err.message}
        </div>
      ))}
    </div>
  );
}
