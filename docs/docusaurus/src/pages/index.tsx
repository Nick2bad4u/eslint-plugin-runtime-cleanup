import Head from "@docusaurus/Head";
import Link from "@docusaurus/Link";
import useBaseUrl from "@docusaurus/useBaseUrl";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import GitHubStats from "../components/GitHubStats";

import styles from "./index.module.css";

type HeroBadge = {
    readonly description: string;
    readonly icon: string;
    readonly label: string;
};

type HeroStat = {
    readonly description: string;
    readonly headline: string;
};

type HomeCard = {
    readonly description: string;
    readonly icon: string;
    readonly title: string;
    readonly to: string;
};

/**
 * Hero badges Note: These icons are from the "Nerd Font Symbols" font.
 *
 * @see https://www.nerdfonts.com/cheat-sheet for available icons in the "Nerd Font Symbols" font
 */
const heroBadges = [
    {
        description: "Drop-in config for ESLint v9+ and modern repos.",
        icon: "\uf013",
        label: "Flat Config native",
    },
    {
        description: "Type-aware guidance without sacrificing readability.",
        icon: "\ue628",
        label: "TypeScript-first",
    },
    {
        description: "Clear diagnostics with safe autofixes and suggestions.",
        icon: "\uf0ad",
        label: "Actionable rule docs",
    },
] as const satisfies readonly HeroBadge[];

/**
 * Hero stats Note: These icons are from the "Nerd Font Symbols" font.
 *
 * @see https://www.nerdfonts.com/cheat-sheet for available icons in the "Nerd Font Symbols" font
 */
const heroStats = [
    {
        description: "Ready for the first runtime cleanup rules.",
        headline: "\uf0ca Clean Scaffold",
    },
    {
        description: "Start small, then scale to stricter coverage.",
        headline: "\ue690 6 Presets",
    },
    {
        description: "Safe rewrites where semantics are preserved.",
        headline: "\udb80\udc68 DX-first Autofix & Suggestions",
    },
] as const satisfies readonly HeroStat[];

/**
 * Button icons Note: These icons are from the "Nerd Font Symbols" font.
 *
 * @see https://www.nerdfonts.com/cheat-sheet for available icons in the "Nerd Font Symbols" font
 */
const overviewButtonIcon = "\udb81\udf1d";
const comparePresetsButtonIcon = "\udb85\udc92";
const heroKickerIcon = "\uf0ad";
const heroKickerIcon2 = "\uf135";
const packageName = "eslint-plugin-runtime-cleanup";
const homepageDescription = `Explore ${packageName} documentation, presets, and rule references for enforcing cleanup of timers, listeners, observers, AbortController instances, workers, streams, child processes, and disposables.`;
const homepageKeywords = `${packageName}, runtime cleanup, eslint rules, timers, event listeners, abortcontroller, workers, streams, disposables, typescript linting, flat config`;
const homepageStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    codeRepository: `https://github.com/Nick2bad4u/${packageName}`,
    description: homepageDescription,
    image: `https://nick2bad4u.github.io/${packageName}/img/logo.png`,
    license: `https://github.com/Nick2bad4u/${packageName}/blob/main/LICENSE`,
    name: packageName,
    programmingLanguage: "TypeScript",
    runtimePlatform: "Node.js",
    url: `https://nick2bad4u.github.io/${packageName}/`,
} as const;
const homepageSocialImageUrl = `https://nick2bad4u.github.io/${packageName}/img/logo.png`;

/**
 * Home card icons Note: These icons are from the "Nerd Font Symbols" font,
 * which is included in the site styles. If you change these icons, make sure to
 * choose ones that exist in that font or adjust the font-family in the CSS
 * accordingly.
 *
 * @see https://www.nerdfonts.com/cheat-sheet for available icons in the "Nerd Font Symbols" font
 */
const homeCards = [
    {
        icon: "\uf135",
        title: "Get Started",
        description:
            "Install the plugin, enable a preset, and prepare a runtime cleanup linting baseline.",
        to: "/docs/rules/getting-started",
    },
    {
        icon: "\ue690",
        title: "Presets",
        description:
            "Choose the right preset for your team, from minimal baseline to full strict coverage.",
        to: "/docs/rules/presets",
    },
    {
        icon: "\uf02d",
        title: "Rule Reference",
        description:
            "Review the current rule roadmap and the documentation shape future rules will use.",
        to: "/docs/rules/overview",
    },
] as const satisfies readonly HomeCard[];

/**
 * Render the Docusaurus landing page for the documentation site.
 */
export default function Home() {
    const logoSrc = useBaseUrl("/img/logo.svg");

    return (
        <Layout
            title="ESLint rules for runtime cleanup"
            description={homepageDescription}
        >
            <Head>
                <meta content={homepageKeywords} name="keywords" />
                <meta content={homepageSocialImageUrl} property="og:image" />
                <meta content="summary_large_image" name="twitter:card" />
                <meta content={homepageSocialImageUrl} name="twitter:image" />
                <script type="application/ld+json">
                    {JSON.stringify(homepageStructuredData)}
                </script>
            </Head>
            <header className={styles.heroBanner}>
                <div className={`container ${styles.heroContent}`}>
                    <div className={styles.heroGrid}>
                        <div>
                            <p className={styles.heroKicker}>
                                {`${heroKickerIcon} ESLint plugin for modern TypeScript teams ${heroKickerIcon2}`}
                            </p>
                            <Heading as="h1" className={styles.heroTitle}>
                                {packageName}
                            </Heading>
                            <p className={styles.heroSubtitle}>
                                ESLint rules for code that allocates runtime
                                resources and must release them deliberately:
                                timers, listeners, observers, AbortController
                                instances, workers, streams, child processes,
                                and disposables.
                            </p>

                            <div className={styles.heroBadgeRow}>
                                {heroBadges.map((badge) => (
                                    <article
                                        key={badge.label}
                                        className={styles.heroBadge}
                                    >
                                        <p className={styles.heroBadgeLabel}>
                                            <span
                                                aria-hidden="true"
                                                className={styles.heroBadgeIcon}
                                            >
                                                {badge.icon}
                                            </span>
                                            {badge.label}
                                        </p>
                                        <p
                                            className={
                                                styles.heroBadgeDescription
                                            }
                                        >
                                            {badge.description}
                                        </p>
                                    </article>
                                ))}
                            </div>

                            <div className={styles.heroActions}>
                                <Link
                                    className={`button button--lg ${styles.heroActionButton} ${styles.heroActionPrimary}`}
                                    to="/docs/rules/overview"
                                >
                                    {overviewButtonIcon} Start with Overview
                                </Link>
                                <Link
                                    className={`button button--lg ${styles.heroActionButton} ${styles.heroActionSecondary}`}
                                    to="/docs/rules/presets"
                                >
                                    {comparePresetsButtonIcon} Compare Presets
                                </Link>
                            </div>
                        </div>

                        <aside className={styles.heroPanel}>
                            <img
                                alt={`${packageName} logo`}
                                className={styles.heroPanelLogo}
                                decoding="async"
                                height="240"
                                loading="eager"
                                src={logoSrc}
                                width="240"
                            />
                        </aside>
                    </div>

                    <GitHubStats className={styles.heroLiveBadges} />

                    <div className={styles.heroStats}>
                        {heroStats.map((stat) => (
                            <article
                                key={stat.headline}
                                className={styles.heroStatCard}
                            >
                                <p className={styles.heroStatHeading}>
                                    {stat.headline}
                                </p>
                                <p className={styles.heroStatDescription}>
                                    {stat.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </header>

            <main className={styles.mainContent}>
                <section className="container">
                    <div className={styles.cardGrid}>
                        {homeCards.map((card) => (
                            <article key={card.title} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <p className={styles.cardIcon}>
                                        {card.icon}
                                    </p>
                                    <Heading
                                        as="h2"
                                        className={styles.cardTitle}
                                    >
                                        {card.title}
                                    </Heading>
                                </div>
                                <p className={styles.cardDescription}>
                                    {card.description}
                                </p>
                                <Link className={styles.cardLink} to={card.to}>
                                    Open section →
                                </Link>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </Layout>
    );
}
