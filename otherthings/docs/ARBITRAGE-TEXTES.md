# Arbitrage des textes — préalable à l'i18n

> **Ce document attend vos décisions.** Rien ne sera traduit avant.
> Annotez directement les cases `[ ]` puis commitez ; je m'appuierai dessus
> pour réécrire `fr.json` et produire l'anglais et le néerlandais.

## Pourquoi cet arbitrage

Les trois fichiers de traduction (`fr.json`, `en.json`, `nl.json`) sont parfaitement alignés entre eux — 85 clés identiques — mais **leur contenu ne correspond pas à ce qu'affiche le site**. Ils contiennent des textes génériques, probablement un remplissage initial jamais confronté aux composants.

Conséquence : câbler les composants sans arbitrage remplacerait l'identité CMCI par des formules passe-partout, **sans lever la moindre erreur**. Le site continuerait de fonctionner en disant autre chose.

Vous avez choisi de redéfinir les textes vous-même. Voici chaque écart.

**Comment répondre** : cochez une option par bloc, ou écrivez votre propre texte dans la ligne `Votre texte :`.

---

## 1. Les valeurs — l'écart le plus important

Le composant décline l'acronyme **C.M.C.I.**, ce que les traductions ignorent complètement.

| | Version A — composant (en ligne aujourd'hui) | Version B — `fr.json` |
|---|---|---|
| Valeur 1 | **Communauté** — Nous sommes une famille spirituelle unie par l'amour du Christ, vivant dans la communion fraternelle et le soutien mutuel. | **Foi vivante** — Une foi authentique qui transforme et inspire, fondée sur la Parole de Dieu |
| Valeur 2 | **Missionnaire** — Nous sommes appelés à porter l'Évangile partout, faisant des disciples dans toutes les nations selon le commandement de Jésus. | **Communion fraternelle** — Une famille spirituelle unie par l'amour du Christ et le soutien mutuel |
| Valeur 3 | **Chrétienne** — Christ est notre fondement, notre modèle et notre but. Nous vivons selon Sa Parole et marchons par Son Esprit. | **Service dévoué** — Servir Dieu et notre prochain avec excellence et dévouement |
| Valeur 4 | **Internationale** — Nous accueillons toutes les nations dans l'amour de Dieu, reflétant la diversité du Royaume des cieux sur terre. | **Croissance continue** — Un développement spirituel constant pour accomplir notre destinée |

La version A se referme sur cette phrase : *« C.M.C.I. — Quatre lettres, une mission : transformer le monde par la puissance de l'Évangile. »*

- [ ] **A** — garder l'acronyme CMCI *(recommandé : c'est votre identité, et la version B est interchangeable avec n'importe quelle église)*
- [ ] **B** — adopter les textes de `fr.json`
- [ ] Autre → `Votre texte :`

**Titres de la section** — A : « Nos Piliers » / « Nos Valeurs Fondamentales » · B : « Nos valeurs » / « Ce en quoi nous croyons » / sous-titre « Nos valeurs fondamentales guident notre vie et notre mission »

- [ ] A  - [ ] B  - [ ] Autre → `Votre texte :`

---

## 2. La vision — la vision 2065 contre des formules génériques

| | Version A — composant (en ligne) | Version B — `fr.json` |
|---|---|---|
| Bloc 1 | **Évangéliser le monde** — Atteindre 10 milliards de personnes par l'Évangile dans la puissance du Saint-Esprit, proclamant le message de salut à toutes les nations. | **Formation biblique** — Équiper les disciples à travers un enseignement solide et pratique de la Parole |
| Bloc 2 | **Former des disciples** — 1 milliard de disciples dans 250 nations organisés en 25 millions d'églises de maison d'ici 2065, suivant le modèle de Jésus. | **Impact missionnaire** — Atteindre les nations avec l'Évangile et transformer les communautés |
| Bloc 3 | **Prier pour le réveil** — Coopérer avec Dieu par le jeûne et l'intercession pour le réveil mondial, préparant le retour glorieux de notre Seigneur. | **Leadership** — Former des leaders selon le modèle de Christ pour servir l'Église |

La version A porte les objectifs chiffrés de la vision CMCI (10 milliards, 1 milliard de disciples, 250 nations, 25 millions d'églises de maison, horizon 2065). La version B les efface.

- [ ] **A** — garder la vision chiffrée *(recommandé)*
- [ ] **B** — adopter les textes de `fr.json`
- [ ] Autre → `Votre texte :`

**Titres** — A : « Notre Vision » / « Transformer le monde par l'Évangile » · B : « Notre vision » / « Former des disciples pour impacter les nations » / sous-titre « Notre vision est claire : équiper chaque croyant pour vivre pleinement sa foi »

- [ ] A  - [ ] B  - [ ] Autre → `Votre texte :`

---

## 3. Textes présents dans le code mais absents des traductions

Ceux-ci n'ont **pas d'équivalent** dans `fr.json` : il faut créer les clés. Je propose de reprendre l'existant tel quel. Corrigez ce qui vous convient moins.

### Hero
| Élément | Texte actuel |
|---|---|
| Bouton 1 | Découvrir notre vision |
| Bouton 2 | Prochains événements |

### Événements
| Élément | Texte actuel |
|---|---|
| Sur-titre | Agenda |
| Titre | Prochains Événements |
| Liste vide | Aucun événement à venir pour le moment. |
| Chargement | Chargement des événements... |
| Bouton d'inscription | S'inscrire *(remplaçable par événement depuis l'admin)* |

### Assemblées
| Élément | Texte actuel |
|---|---|
| Sur-titre | Nous Trouver |
| Titre | Nos Assemblées en Belgique |
| Sous-titre | Rejoignez-nous dans l'une de nos assemblées pour vivre la communion… |
| Bouton | Voir toutes nos assemblées |

### Galerie
| Élément | Texte actuel |
|---|---|
| Sur-titre | Souvenirs |
| Titre | Notre Galerie Photo |
| Liste vide | Aucune photo disponible pour le moment. |
| Bouton | Voir plus de photos |

> ⚠️ Les traductions disent « Galerie » / « Nos moments en images » / « Découvrez la vie de notre communauté à travers ces moments partagés ». Écart à trancher :
> - [ ] Garder « Souvenirs / Notre Galerie Photo » - [ ] Adopter la version `fr.json` - [ ] Autre

### Témoignages
| Élément | Texte actuel |
|---|---|
| Sur-titre | Témoignages |
| Titre | Ce que disent nos membres |
| Liste vide | Aucun témoignage disponible pour le moment. |

> ⚠️ Les traductions disent « Ils témoignent » / « Découvrez comment Dieu transforme des vies à travers notre communauté ».
> - [ ] Garder « Ce que disent nos membres » - [ ] Adopter « Ils témoignent » - [ ] Autre

### Ministères
| Élément | Texte actuel |
|---|---|
| Sur-titre | Nos Ministères |
| Titre | Nos Ministères à la CMCI |
| Sous-titre | Découvrez nos principaux ministères actuellement en place dans notre église. Si vous souhaitez vous impliquer dans l'un de ces ministères, n'hésitez pas à nous contacter. |
| Bouton carte | En savoir plus |
| Encart bas | Rejoignez l'un de nos ministères — Nous serions ravis de vous accueillir… |

> ⚠️ Les traductions disent « Nos ministères » / « Servir ensemble » / « Découvrez nos différents ministères et trouvez votre place pour servir ».
> - [ ] Garder la version du composant - [ ] Adopter « Servir ensemble » - [ ] Autre

### Pied de page
| Élément | Texte actuel |
|---|---|
| Description | La Communauté Missionnaire Chrétienne Internationale en Belgique — une famille de disciples dévoués à Jésus-Christ, notre modèle en toutes choses. |
| Mentions | © 2026 CMCI Belgique. Tous droits réservés. Fait avec ♥ pour la gloire de Dieu. |
| Liens | Mentions légales · Politique de confidentialité |

---

## 4. Décisions transverses

**Capitales.** Le site mélange « Prochains Événements » (capitale à chaque mot, usage anglais) et « Nos valeurs » (usage français). L'usage français ne capitalise que le premier mot.

- [ ] Harmoniser en usage français : « Prochains événements », « Nos valeurs fondamentales » *(recommandé)*
- [ ] Garder les capitales actuelles
- [ ] Autre

**Section contact.** `fr.json` contient une section `contact` complète et traduite en 3 langues (titre, sous-titre, téléphone, e-mail, adresse, horaires), mais **aucun composant `contact.tsx` n'existe** et le menu pointe vers `#contact`, une ancre sans destination.

- [ ] Construire la section contact *(les traductions existent déjà)*
- [ ] Supprimer les clés `contact` inutilisées
- [ ] Laisser en l'état pour l'instant

---

## 5. Signalé au passage — hors périmètre i18n

Constats faits pendant le relevé, sans lien avec les traductions :

1. **Les liens réseaux sociaux du footer ne s'affichent pas.** Le tableau `socialLinks` est déclaré dans `footer.tsx` mais n'est jamais utilisé — les icônes Facebook, YouTube et Instagram ne sont pas rendues. Les URL y sont d'ailleurs des valeurs de remplissage (`https://facebook.com`), pas vos comptes réels.
2. **Le bouton « Voir plus de photos » de la galerie ne fait rien** — aucun gestionnaire de clic.
3. **Les liens « Mentions légales » et « Politique de confidentialité » pointent vers `#`.** Pour un site belge collectant des adresses e-mail via la newsletter, l'absence de politique de confidentialité est un manquement au RGPD.

Dites-moi si vous voulez que je traite l'un de ces points.
