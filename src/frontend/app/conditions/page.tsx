import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection, ContactMail } from "@/components/site/legal-page"
import { fetchSettings } from "@/lib/server-data"

const TITLE = "Conditions d'utilisation — CMCI Belgique"
const DESCRIPTION = "Les règles d'utilisation du site de la CMCI Belgique : contenus, livres et tracts, liens externes, responsabilité."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/conditions" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/conditions", siteName: "CMCI Belgique", type: "website", locale: "fr_BE", images: ["/cmci-logo.png"] },
}

/** Conditions d'utilisation du site (à relire si le site propose un jour de nouveaux services). */
export default async function ConditionsPage() {
  const settings = await fetchSettings()
  const mail = <ContactMail settings={settings} />

  return (
    <LegalPage
      eyebrow="Mentions légales"
      title="Conditions d'utilisation"
      updated="Dernière mise à jour : 5 novembre 2026"
      intro="En utilisant le site cmcibelgique.org, vous acceptez les règles ci-dessous. Elles sont simples : le site est là pour vous informer, vous inviter et vous permettre de lire et de partager nos publications."
      settings={settings}
    >
      <LegalSection n={1} title="Qui édite ce site ?">
        <p>
          Le site <strong>www.cmcibelgique.org</strong> est édité par la <strong>CMCI Belgique</strong> (Communauté Missionnaire Chrétienne Internationale en Belgique){settings.contact_address ? <>, {settings.contact_address}</> : null}.
          Contact : {mail}.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Accès au site">
        <p>
          L'accès au site est gratuit. Nous faisons le maximum pour qu'il soit disponible en permanence, sans pouvoir le garantir : il peut être
          interrompu pour une maintenance ou en cas de problème technique.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Contenus du site">
        <ul>
          <li><strong>Textes, images, logo et vidéos de la CMCI Belgique</strong> : ils appartiennent à l'église. Vous pouvez les partager par lien ; toute autre réutilisation, notamment commerciale, demande notre accord écrit.</li>
          <li><strong>Tracts</strong> : ils sont faits pour être lus, téléchargés et partagés gratuitement, sans modification et avec la mention de leur origine.</li>
          <li><strong>Livres</strong> : le catalogue présente des ouvrages dont les droits appartiennent à leurs auteurs et éditeurs. Leur lecture ou leur achat passe par les services indiqués sur chaque fiche.</li>
          <li><strong>Photos de la galerie</strong> : elles illustrent la vie de l'église. Si vous apparaissez sur l'une d'elles et souhaitez qu'elle soit retirée, écrivez-nous : nous le ferons rapidement.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Publications des réseaux sociaux et liens externes">
        <p>
          Le site peut afficher des vidéos et des publications provenant de nos comptes YouTube, Facebook, Instagram et TikTok, et contient des liens vers d'autres sites.
          Ces contenus restent la propriété de leurs plateformes et de leurs auteurs, et leurs propres conditions s'appliquent dès que vous les ouvrez.
          Nous ne sommes pas responsables du contenu des sites vers lesquels nous renvoyons.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Formulaires et newsletter">
        <p>
          Quand vous vous inscrivez à une activité ou à la newsletter, merci de donner des informations exactes et de n'inscrire que vous-même (ou une personne qui vous en a chargé).
          Vous pouvez vous désabonner à tout moment en nous écrivant. Le traitement de vos données est détaillé dans la
          {" "}<Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Utilisation correcte">
        <p>Il est interdit de perturber le fonctionnement du site, d'essayer d'accéder à l'espace d'administration sans autorisation, ou d'utiliser les formulaires pour envoyer des messages abusifs ou trompeurs.</p>
      </LegalSection>

      <LegalSection n={7} title="Exactitude des informations et responsabilité">
        <p>
          Les informations pratiques (dates, horaires, lieux des événements et des assemblées) sont données de bonne foi mais peuvent changer :
          en cas de doute, contactez-nous avant de vous déplacer. La CMCI Belgique ne peut être tenue responsable d'un dommage lié à l'utilisation du site, dans la mesure permise par la loi.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Droit applicable">
        <p>Ces conditions sont régies par le droit belge. Pour toute difficulté, nous vous invitons d'abord à nous écrire afin de trouver une solution à l'amiable.</p>
      </LegalSection>

      <LegalSection n={9} title="Modifications">
        <p>Nous pouvons adapter ces conditions ; la date de mise à jour figure en haut de la page.</p>
      </LegalSection>

      {/* Résumé en anglais */}
      <section id="english" lang="en" className="mt-16 rounded-lg border border-or/25 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Terms of use — summary in English</h2>
        <p>
          cmcibelgique.org is the official website of CMCI Belgique, a church in Belgium. It is free to use and provided "as is".
          Texts, images and videos published by the church belong to it; tracts may be shared freely and unchanged; books remain the property of their authors and publishers.
          Videos and posts from our YouTube, Facebook, Instagram and TikTok accounts remain subject to those platforms' own terms.
          Please do not disrupt the site or attempt to access its admin area. Practical information such as dates and places may change.
          These terms are governed by Belgian law. Questions: {mail}.
        </p>
      </section>
    </LegalPage>
  )
}
