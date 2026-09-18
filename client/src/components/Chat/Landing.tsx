import { useLocalize } from '~/hooks';

export default function Landing({
  centerFormOnLanding: _centerFormOnLanding,
}: {
  centerFormOnLanding: boolean;
}) {
  const localize = useLocalize();

  return (
    <section className="ting-welcome" aria-labelledby="ting-welcome-title">
      <h1 id="ting-welcome-title" className="ting-welcome__title">
        {localize('com_ting_welcome_title')}
      </h1>
      <p className="ting-welcome__description">{localize('com_ting_welcome_description')}</p>
    </section>
  );
}
