import { Hammer } from 'lucide-react';

interface PlaceholderPageProps {
  title?: string;
  description?: string;
}

export default function PlaceholderPage({
  title = 'Em construção',
  description = 'Esta tela será implementada nas próximas entregas do projeto.',
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-full bg-brand-soft text-brand flex items-center justify-center mb-4">
        <Hammer className="w-6 h-6" strokeWidth={2} />
      </div>
      <h2 className="text-lg font-semibold text-ink mb-2">{title}</h2>
      <p className="text-sm text-muted max-w-md text-center">{description}</p>
    </div>
  );
}