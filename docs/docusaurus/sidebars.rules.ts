/**
 * @packageDocumentation
 * Sidebar generation for plugin rule documentation sections.
 */
import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const ruleDocIds = [
    "no-floating-abort-controllers",
    "no-floating-audio-contexts",
    "no-floating-broadcast-channels",
    "no-floating-child-processes",
    "no-floating-disposable-stacks",
    "no-floating-file-watchers",
    "no-floating-geolocation-watches",
    "no-floating-infinite-animations",
    "no-floating-media-streams",
    "no-floating-message-channels",
    "no-floating-network-connections",
    "no-floating-object-urls",
    "no-floating-observers",
    "no-floating-servers",
    "no-floating-streams",
    "no-floating-timers",
    "no-floating-wake-locks",
    "no-floating-web-stream-locks",
    "no-floating-workers",
    "no-unmanaged-event-listeners",
] as const;

const ruleDocItems = ruleDocIds.map((ruleDocId) => ({
    id: ruleDocId,
    label: ruleDocId,
    type: "doc" as const,
}));

/** Complete sidebar structure for docs site navigation. */
const sidebars = {
    rules: [
        {
            className: "sb-doc-overview",
            id: "overview",
            label: "Overview",
            type: "doc",
        },
        {
            className: "sb-doc-getting-started",
            id: "getting-started",
            label: "Getting Started",
            type: "doc",
        },
        {
            className: "sb-cat-guides",
            collapsed: true,
            customProps: {
                badge: "guides",
            },
            items: [
                {
                    id: "guides/adoption-checklist",
                    label: "Adoption checklist",
                    type: "doc",
                },
                {
                    id: "guides/rollout-and-fix-safety",
                    label: "Rollout and fix safety",
                    type: "doc",
                },
                {
                    id: "guides/preset-selection-strategy",
                    label: "Preset selection strategy",
                    type: "doc",
                },
                {
                    id: "guides/type-aware-linting-readiness",
                    label: "Type-aware linting readiness",
                    type: "doc",
                },
            ],
            label: "Adoption & Rollout",
            link: {
                description:
                    "Migration, rollout, and fix-safety guidance for future runtime-cleanup rule adoption.",
                title: "Adoption & Rollout",
                type: "generated-index",
            },
            type: "category",
        },
        {
            className: "sb-cat-rules-cleanup",
            collapsed: false,
            customProps: {
                badge: "rules",
            },
            items: ruleDocItems,
            label: "Rules",
            link: {
                description:
                    "Runtime cleanup rules for resource-lifetime patterns.",
                title: "Rules",
                type: "generated-index",
            },
            type: "category",
        },
        {
            className: "sb-cat-presets",
            collapsed: false,
            customProps: {
                badge: "presets",
            },
            items: [
                {
                    className: "sb-preset-minimal",
                    id: "presets/minimal",
                    label: "Minimal",
                    type: "doc",
                },
                {
                    className: "sb-preset-recommended",
                    id: "presets/recommended",
                    label: "Recommended",
                    type: "doc",
                },
                {
                    className: "sb-preset-recommended-type-checked",
                    id: "presets/recommended-type-checked",
                    label: "Recommended type-checked",
                    type: "doc",
                },
                {
                    className: "sb-preset-strict",
                    id: "presets/strict",
                    label: "Strict",
                    type: "doc",
                },
                {
                    className: "sb-preset-all",
                    id: "presets/all",
                    label: "All",
                    type: "doc",
                },
                {
                    className: "sb-preset-experimental",
                    id: "presets/experimental",
                    label: "Experimental",
                    type: "doc",
                },
            ],
            label: "Presets",
            link: {
                id: "presets/index",
                type: "doc",
            },
            type: "category",
        },
    ],
} satisfies SidebarsConfig;

export default sidebars;
