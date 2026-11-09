import type { Metadata } from "next"
import { LegalPage, LegalSection, ContactMail } from "@/components/site/legal-page"
import { fetchSettings } from "@/lib/server-data"

const TITLE = "Politique de confidentialité — CMCI Belgique"
const DESCRIPTION = "Quelles données le site de la CMCI Belgique collecte, pourquoi, combien de temps, et comment exercer vos droits."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/confidentialite" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/confidentialite", siteName: "CMCI Belgique", type: "website", locale: "fr_BE", images: ["/cmci-logo.png"] },
}

/**
 * Politique de confidentialité. Elle décrit ce que le site fait réellement :
 * pas de mesure d'audience ni de publicité, une newsletter par e-mail,
 * des formulaires d'inscription, quelques services tiers, et la liaison des
 * comptes de réseaux sociaux de l'église (dont TikTok). À relire si une de
 * ces fonctions change.
 */
export default async function ConfidentialitePage() {
  const settings = await fetchSettings()
  const mail = <ContactMail settings={settings} />

  return (
    <LegalPage
      eyebrow="Vie privée"
      title="Politique de confidentialité"
      updated="Dernière mise à jour : 5 novembre 2026"
      intro="Le site cmcibelgique.org est celui de la CMCI Belgique. Nous collectons très peu de données, uniquement pour vous répondre ou vous tenir informé, et nous ne les vendons ni ne les utilisons à des fins publicitaires."
      settings={settings}
    >
      <LegalSection n={1} title="Qui est responsable de vos données ?">
        <p>
          Le responsable du traitement est la <strong>CMCI Belgique</strong> (Communauté Missionnaire Chrétienne Internationale en Belgique),
          éditrice du site <strong>www.cmcibelgique.org</strong>{settings.contact_address ? <>, établie à {settings.contact_address}</> : null}.
        </p>
        <p>Pour toute question sur vos données : {mail}.</p>
      </LegalSection>

      <LegalSection n={2} title="Les données que nous collectons">
        <p><strong>Pas de suivi.</strong> Le site n'utilise aucun outil de mesure d'audience, aucune publicité et aucun cookie de suivi. Vous pouvez le parcourir sans nous donner la moindre information.</p>
        <p>Nous ne recevons des données que dans les cas suivants :</p>
        <ul>
          <li>
            <strong>Newsletter</strong> : votre adresse e-mail, pour vous envoyer les annonces et les événements de l'église.
            Base légale : votre consentement. Conservation : jusqu'à votre désabonnement.
          </li>
          <li>
            <strong>Formulaires d'inscription</strong> (rencontres, événements…) : les informations que vous saisissez (elles varient selon le formulaire),
            pour organiser l'activité concernée. Base légale : votre demande d'inscription. Conservation : le temps nécessaire à l'organisation de l'activité,
            puis suppression. Les réponses peuvent aussi être copiées dans une feuille de calcul Google gérée par l'église, pour leur suivi.
          </li>
          <li>
            <strong>Contact par e-mail</strong> : votre message et votre adresse, pour vous répondre. Ils ne sont pas réutilisés pour autre chose.
          </li>
          <li>
            <strong>Compteurs de lecture</strong> : le nombre de consultations et de « J'aime » d'un livre est un simple compteur, sans lien avec une personne.
          </li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="Ce qui est mémorisé dans votre navigateur">
        <p>Pour le confort de navigation uniquement, et sans suivi, votre navigateur garde localement :</p>
        <ul>
          <li>votre langue et votre choix de thème clair ou sombre ;</li>
          <li>les livres que vous avez aimés ;</li>
          <li>le fait d'avoir masqué le bandeau d'un compte à rebours (pour la durée de la visite).</li>
        </ul>
        <p>Ces informations restent sur votre appareil, ne nous sont pas envoyées et peuvent être effacées dans les réglages de votre navigateur.</p>
      </LegalSection>

      <LegalSection n={4} title="Services tiers utilisés par le site">
        <ul>
          <li><strong>YouTube</strong> : une vidéo n'est chargée que si vous cliquez sur « Regarder » (lecteur en mode « sans cookie »). Avant ce clic, YouTube ne reçoit rien.</li>
          <li><strong>OpenStreetMap</strong> : le fond de la carte des assemblées est fourni par OpenStreetMap, qui reçoit votre adresse IP lorsque la carte s'affiche.</li>
          <li><strong>Gmail (Google)</strong> : envoi de la newsletter et des messages.</li>
          <li><strong>DeepL</strong> : traduction des textes publics rédigés par l'église (événements, ministères…). Aucune donnée de visiteur n'y est envoyée.</li>
          <li><strong>Hébergement</strong> : le site et sa base de données sont hébergés sur un serveur privé virtuel (Hostinger).</li>
          <li><strong>Réseaux sociaux</strong> (Facebook, Instagram, YouTube, TikTok) : quand vous cliquez sur un lien vers l'un d'eux, vous quittez notre site et la politique de ce réseau s'applique.</li>
        </ul>
      </LegalSection>

      <LegalSection id="tiktok" n={5} title="Liaison avec les comptes de réseaux sociaux (dont TikTok)">
        <p>
          Le site affiche les dernières vidéos et publications des comptes officiels de l'église sur YouTube, Facebook, Instagram et TikTok. Cette liaison
          est réalisée <strong>une seule fois par l'administrateur du site</strong>, avec le compte de l'église, depuis un espace privé. Elle ne concerne <strong>pas</strong> les visiteurs.
        </p>
        <p>Pour <strong>TikTok</strong>, nous utilisons « Login Kit » avec deux autorisations :</p>
        <ul>
          <li><strong>user.info.basic</strong> : lire le nom du compte de l'église, afin de vérifier dans l'espace privé que le bon compte est relié ;</li>
          <li><strong>video.list</strong> : lire la liste des vidéos récentes du compte de l'église (titre, image de couverture, lien).</li>
        </ul>
        <p>
          Chaque vidéo est examinée et approuvée par l'administrateur avant d'apparaître sur la page d'accueil, avec un lien vers TikTok.
          Nous ne publions rien sur le compte, nous ne collectons aucune donnée sur d'autres utilisateurs de TikTok, et seuls les jetons d'accès du compte de l'église
          sont conservés, sur notre serveur, sans jamais être affichés en entier ni transmis à un tiers.
        </p>
        <p>
          Vous pouvez à tout moment retirer cette autorisation depuis les réglages de sécurité de votre compte TikTok, ou nous demander de supprimer les jetons et les vidéos importées : {mail}.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Combien de temps et avec quelle sécurité ?">
        <p>
          Nous gardons les données uniquement le temps indiqué plus haut. L'accès à l'administration du site est réservé à quelques personnes de l'église,
          protégées par mot de passe. Les échanges avec le site sont chiffrés (HTTPS).
        </p>
      </LegalSection>

      <LegalSection n={7} title="Vos droits">
        <p>Conformément au RGPD, vous pouvez à tout moment :</p>
        <ul>
          <li>accéder à vos données, les faire corriger ou les faire effacer ;</li>
          <li>limiter leur utilisation ou vous y opposer ;</li>
          <li>retirer votre consentement (par exemple vous désabonner de la newsletter) ;</li>
          <li>demander une copie de vos données dans un format réutilisable.</li>
        </ul>
        <p>
          Il suffit de nous écrire à {mail} : nous répondons dans un délai d'un mois.
          Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'
          <a href="https://www.autoriteprotectiondonnees.be" target="_blank" rel="noopener noreferrer">Autorité de protection des données</a> (Belgique).
        </p>
      </LegalSection>

      <LegalSection n={8} title="Modifications">
        <p>Nous pouvons mettre à jour cette page, par exemple si une nouvelle fonction du site change la façon dont vos données sont traitées. La date de mise à jour figure en haut de la page.</p>
      </LegalSection>

      {/* Résumé en anglais */}
      <section id="english" lang="en" className="mt-16 rounded-lg border border-or/25 p-6 sm:p-8">
        <h2 className="font-display text-2xl">Privacy policy — summary in English</h2>
        <p>
          cmcibelgique.org is the website of CMCI Belgique, a church in Belgium. We do not use analytics, advertising or tracking cookies.
          We only receive personal data when you subscribe to our newsletter (your e-mail address), fill in a registration form, or write to us,
          and we use it solely for that purpose. We never sell it. You may ask us at any time to access, correct or delete it, at {mail}.
        </p>
        <p>
          <strong>TikTok.</strong> The church's administrator connects the church's own TikTok account once, through TikTok Login Kit, from a private admin area.
          We request <strong>user.info.basic</strong> (to display the connected account's name in that admin area) and <strong>video.list</strong> (to list the account's recent videos:
          title, cover image and link). Each video is approved by the administrator before it is shown on our home page with a link back to TikTok.
          We do not post on the account, we do not collect data about other TikTok users, and we only store the church account's own access tokens on our server.
          The authorization can be revoked at any time in TikTok's security settings or by contacting us.
        </p>
      </section>
    </LegalPage>
  )
}
