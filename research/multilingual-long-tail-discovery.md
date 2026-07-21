# Multilingual long-tail discovery, 1860–1930

## Decision

The familiar works should remain in the project, but only as a **control set**. Butler, Wells, Taylor, Capek, and the other canonical authors tell us whether the retrieval method can recover known material. They must not define the historical sample.

The discovery corpus should instead be built passage-first from period vocabularies, deliberately sampled across languages, regions, genres, and decades. Its target is not “early AI writing.” Its target is any primary-source passage that takes a position on:

1. whether an artificial or mechanical being can think, feel, will, or deserve standing;
2. whether machinery expands or diminishes the worker's practical control;
3. whether dependence on technical systems causes judgment or capacity to atrophy;
4. whether measurement, surveillance, propaganda, or centralized administration can steer people without overt force;
5. whether the human mind or body is itself a mechanism;
6. whether technical education or infrastructure redistributes political capacity;
7. who is responsible for the conduct or suffering of a made being; or
8. what should be done when technical systems become difficult to refuse, govern, or escape.

This definition is wide enough to find historical concepts that do not look like present-day “AI,” while still being narrow enough to produce questions about autonomy and machines.

## What the pilot now contains

- **24 control works downloaded:** the recognizable sources that calibrate the search.
- **15 long-tail pilot candidates:** Spanish, French, Italian, Russian, Hungarian, Japanese, Chinese, Polish, Romanian, Portuguese, German, and English from colonial Bengal.
- **1 reception item:** the 1925 Korean translation of *R.U.R.*, intentionally separated from independent-source counts.
- **10 passage records:** original text, working translation, locator, proposed question, Nathan-question links, codebook tags, codebook gaps, and provenance notes.
- **49 MB of local source files:** held under `data-local/historical-sources/`, ignored by Git, and reproducible from the tracked manifest and downloader.

Thirteen of the fifteen long-tail works have usable local text. The *Ignis* download is incomplete because French Wikisource is rate-limiting and stalling; Wu Jianren's *New Story of the Stone* is not yet local. Kapp's scan needs OCR, and the original portion of the Anestin reprint needs to be isolated from its modern introduction.

The pilot's best result is not another machine-revolt story. Wakizo Hosoi's 1923 poem says explicitly that the machine has no brain or desire, yet its operator becomes part of the mechanism and only the rich benefit. That is a historical position the familiar “will machines supersede us?” canon tends to hide.

## Why ordinary searching keeps returning the canon

Four retrieval choices reproduce the familiar list even when the search is multilingual:

- **Starting with present-day labels.** Searching for “artificial intelligence,” “alignment,” or even “robot” excludes most of the period's own conceptual vocabulary.
- **Sorting by citation or web rank.** This returns works already translated, anthologized, and studied in English.
- **Searching fiction alone.** Questions about control often appear more directly in labor newspapers, factory reports, feminist periodicals, physiological debates, popular-science columns, and administrative writing.
- **Ignoring transmission.** A translation or explicit response can appear to be a separate national discovery when it is the same idea traveling. The Korean *Artificial Laborer* and Unamuno's explicit response to *Erewhon* show why every item needs a provenance-relationship field.

“Obscure” should therefore mean **outside the project's control canon and underrepresented in the sampled language/genre stratum**, not merely low in Google results.

## A tractable sampling frame

For a grant prototype, target **40 passages from 25 sources**, not an unbounded world corpus. Use quotas before search results are examined:

| Stratum | Target |
|---|---:|
| Future fiction, satire, drama | 5 sources |
| Worker writing and labor press | 5 |
| Feminist, anticolonial, and reform periodicals | 4 |
| Popular science, invention news, and technical journalism | 4 |
| Philosophy, psychology, and physiology | 4 |
| Administration, policy, factory inquiry, or patent discourse | 3 |

Additional constraints:

- at least 10 languages;
- no language contributes more than 5 sources;
- no author contributes more than 1 admitted source;
- at least 40 percent of sources come from outside western Europe and the United States;
- at least 1 source per language comes from nonfiction or periodical writing where the archive permits it;
- preserve screened non-matches, so the final corpus does not pretend every search hit was relevant.

The date bands should also be balanced: 1860–1889, 1890–1914, and 1915–1930. This prevents the robot vocabulary of the 1920s from swallowing earlier discussions of automata, self-acting machinery, nervous mechanism, factory discipline, and technical dependence.

## Period-language seed lexicon

These are discovery seeds, not inclusion criteria. Search inflections, historical spellings, transliterations, and OCR-confusion variants.

| Language | Artificial person / mind | Labor, control, and dependence | Future / technical discourse |
|---|---|---|---|
| French | automate, homme-machine, machine pensante, cerveau mecanique | machinisme, ouvrier-machine, servitude des machines | avenir, cite future, industrie automatique |
| German | Automat, Maschinenmensch, denkende Maschine | Mensch und Maschine, Maschinenknecht, Mechanisierung, selbsttatig | Zukunft, Technik, Fabrik, Geist |
| Spanish | automata, hombre maquina, maquina pensante, alma mecanica | esclavo de la maquina, obrero, fabrica, trabajo mecanico | porvenir, ciudad futura, progreso |
| Portuguese | automato, homem-maquina, maquina pensante | operario, mecanizacao, trabalho, dependencia | futuro, progresso, reino, cidade |
| Italian | automa, uomo-macchina, macchina pensante | macchinismo, schiavo della macchina, operaio | avvenire, citta futura, forza nervosa |
| Russian | автомат, мыслящая машина, механический человек | человек и машина, раб машины, рабочий, завод | будущее техники, электричество, управление |
| Polish | automat, maszyna myslaca, czlowiek-maszyna | robotnik, fabryka, mechanizacja, niewola | przyszlosc, technika, elektrycznosc |
| Japanese | 自動人形, 人造人間, 機械人間 | 機械, 職工, 工場, 機械的労働 | 科学小説, 未来, 自動, 電気 |
| Chinese | 自動人, 人造人, 機械人 / 机械人 | 機器 / 机器, 工人, 工廠 / 工厂, 勞動 / 劳动 | 科學小說 / 科学小说, 未來 / 未来, 電世界 / 电世界 |
| Korean | 人造人, 人造勞働者, 기계인간 | 機械, 勞働, 工場, 자유 | 科學小說, 미래, 자동 |
| Ottoman Turkish | makine, otomatik, insan makinesi | amele, sanayi, fabrika, hurriyet | terakki, fenni roman, istikbal |
| Bengali | যন্ত্র, কল, কৃত্রিম মানুষ, মানুষ-যন্ত্র | শ্রমিক, কারখানা, স্বাধীনতা | বিজ্ঞান, ভবিষ্যৎ, বিদ্যুৎ |

Before a high-recall search, a reader of each language should correct this seed list and add period-specific euphemisms. The Chinese and Korean searches should include both vernacular script and the Hanja/Hanzi forms used in periodical indexes; Ottoman searches need catalog-authority forms as well as modern transliteration.

## Where to search

Search repositories as strata rather than treating the open web as the corpus:

- multilingual Wikisource and Internet Archive for public-domain books and scans;
- Gallica and Retronews for French books, newspapers, and journals;
- Hemeroteca Digital of the Biblioteca Nacional de Espana and Latin American national newspaper libraries;
- Hemeroteca Digital Brasileira for Brazilian periodicals;
- Aozora Bunko and the National Diet Library digital collections for Japanese texts;
- the Korean History Database, Korean newspaper archives, and Korean Wikisource;
- Chinese Wikisource, late-Qing periodical indexes, and the National Library of China catalog;
- Polona and Wolne Lektury for Polish material;
- the Hungarian Electronic Library and OSZK periodicals;
- ANNO and German-language newspaper portals, plus digitized philosophy-of-technology books;
- South Asian periodical catalogs, the National Digital Library of India, and Bengali magazine archives;
- national labor-history, women's-history, socialist, engineering, and patent collections in every language sampled.

Catalog metadata and secondary scholarship may identify candidates, but an item enters the question bank only when the primary text is retrieved and its passage verified.

## Retrieval procedure

1. **Build a stratum queue.** Pre-assign language, decade, and genre cells. Search the emptiest cell first.
2. **Run lexical searches in the source language.** Combine one machine/body term, one autonomy/control term, and a date or venue constraint.
3. **Sample within results.** Take a fixed number from different pages of results or catalog sort orders; do not select only the highest-ranked titles.
4. **Extract candidate windows.** Save the keyword hit with enough surrounding text to establish who is speaking and what position is taken.
5. **Screen passage-first.** Admit a passage only if it makes a claim, frames a choice, or describes a concrete autonomy mechanism. A machine used merely as scenery is a non-match.
6. **Verify provenance.** Record date, edition, printed page or issue, original/translation/adaptation status, and any named influence.
7. **Translate in layers.** Preserve original text, literal translation, and interpretive gloss separately. Have a second reader review any passage used in a public question.
8. **Map to the codebook.** Assign existing leaf IDs, but add a free `codebookGap` note rather than inventing a forced label.
9. **Freeze before model testing.** Questions and labels are fixed before Talkie or modern-model draws are inspected.

## What embeddings should and should not do

Embeddings are useful after retrieval, not as the historian.

- Embed both the original passage and its literal translation.
- Cluster within languages first, then compare cluster representatives across languages. This reduces the tendency for English translations to become the semantic hub.
- Use similarity to the control corpus to identify likely duplicates and lines of reception.
- Use distance from the controls as a **novelty lead**, never as proof of relevance.
- Pair historical and modern questions only after both banks have their own independently derived taxonomy tags.
- Keep every unpaired question visible; forced one-to-one pairing would erase precisely the historical positions the project is trying to find.

The earlier proposed OpenAI embedding step can remain capped at $1, but it is premature until the candidate passage set is large enough to benefit from it. Lexical retrieval, provenance work, and human screening are currently the bottleneck.

## How the existing codebook should be used

The current codebook is a good **upper ontology**. The pilot passages readily map to `made-persons`, `emergent-mind`, `automatism`, `instrument`, `succession`, `social-arrangement`, and `dependence`.

It should not yet be treated as exhaustive. The long-tail pilot exposes at least four recurring gaps:

1. technology as emancipation or counter-power, not threat;
2. surveillance, legibility, and behavioral normalization;
3. creator responsibility and harms imposed in making a mind; and
4. distributed or structural compulsion, where no machine literally wills but the system propels everyone.

For now, keep the codebook unchanged and record these as gap tags. After 20–30 independent passages have been screened, review whether each gap recurs often enough to justify a new leaf or branch. That lets the historical material revise the schema without allowing every interesting passage to create its own category.

## High-priority discovery queue

These are leads, not admitted evidence. Each needs a primary text, a passage, and provenance verification.

| Language / region | Candidate | Date | Why it is promising | Next retrieval move |
|---|---|---:|---|---|
| French | Didier de Chousy, *Ignis* | 1883 | Automatic industry, made workers, ownership, and machine revolt | Complete the Wikisource chapters after host recovery or locate a Gallica/IA scan |
| Bengali | Hemlal Dutta, “Rahashya” | 1882 | A mechanized, automated house in an early Bengali science periodical | Locate both *Bigyan Darpan* installments and inspect whether convenience changes household agency |
| Chinese | Huangjiang Diaosou, *Yueqiu zhimindi xiaoshuo* | 1904–05 | Treats the body and mind as technically repairable in a national-reform frame | Retrieve the *Xiuxiang xiaoshuo* serial and verify the “washing the heart” passage |
| Chinese | Xu Nianci, *Xin Faluo xiansheng tan* | 1905 | Technological remaking of bodies and brains; artificial-person vocabulary | Retrieve the original illustrated edition, not a modern summary |
| Chinese | Xu Zhuodai, “Renzao renzhong” | 1923 | Artificial laborers and the relation between labor, class, and manufactured life | Locate *Red Magazine*, vol. 2, no. 11 |
| Korean | Park Young-hee trans., *Artificial Laborer* | 1925 | Shows how *R.U.R.* entered colonial Korean labor discourse | Downloaded; compare terminology and framing, but count only as reception |
| Ottoman Turkish | Mustafa Nazim, *Ruyada Terakki ve Medeniyet-i Islamiyeyi Ruyet* | 1913 | Factories, transport, technical progress, and “great mirrors” that watch everything | Locate a scan of the Ottoman-script first edition and inspect surveillance passages |
| Italian | Rosa Rosa, *Una donna con tre anime* | 1918 | Technological modernity transforms a woman's identity and available selves | Locate the 1918 edition or periodical printing; avoid relying on a modern commercial edition |
| Italian | Ruggero Vasari, *L'angoscia delle macchine* | 1925 | Futurist machine drama about mechanized life and revolt | Locate a public-domain first-edition scan and establish whether the work is independent of *R.U.R.* |
| Russian | Alexei Gastev, *Poeziia rabochego udara* | 1918 | Worker-machine fusion in the voice of a labor organizer, outside speculative fiction | Retrieve the Russian first edition and sample passages around bodily synchronization |
| German | Walther Rathenau, *Zur Mechanik des Geistes* | 1913 | Social and intellectual mechanization rather than literal artificial persons | Retrieve a first-edition scan and search *Mechanisierung*, *Seele*, and *Freiheit* |
| Spanish / Uruguay-Argentina | S. Fragoso Lima (Horacio Quiroga), *El hombre artificial* | 1910 | Manufactured sensation and thought, transferred suffering, maker responsibility | Downloaded; add images of the six original *Caras y Caretas* installments |
| Spanish / Mexico | Eduardo Urzaiz, *Eugenia* | 1919 | Reproduction, expertise, and technocratic governance in a Latin American future | Retrieve the first edition and screen for autonomy rather than treating all eugenic material as relevant |
| English / colonial India | Jagadish Chandra Bose, *Response in the Living and Non-Living* | 1902 | Challenges the categorical boundary between living and nonliving response | Retrieve the public-domain text and test it against the codebook's vitalism/mechanism branch |
| Czech | Jan Weiss, *Dum o tisici patrech* | 1929 | An industrial tower organized through perception, control, and manufactured reality | Locate Czech full text and screen for administrative/infrastructural autonomy passages |

## Admission checklist

A source is ready to back a public question only when every answer is yes:

- Is the item a primary source published within the target period?
- Is the author, date, edition, and original language verified?
- Is the passage available in the original language with a stable locator?
- Does the passage itself make the autonomy/machine claim, rather than a modern critic making it for the passage?
- Are translation, adaptation, and named influences recorded?
- Has the translation been checked independently?
- Does the proposed question closely quote or paraphrase the passage?
- Are both a codebook match and any codebook gap recorded?
- If the source is famous within its own national canon, is that stated rather than calling it simply “obscure”?

That last point matters. Hossain, Karinthy, and Zulawski are not obscure everywhere; they are underrepresented in the English-language genealogy of machine autonomy. The project should describe that asymmetry precisely.
