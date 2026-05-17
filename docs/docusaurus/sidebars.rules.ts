/**
 * @packageDocumentation
 * Sidebar generation for plugin rule documentation sections.
 */
import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

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
            type: "category",
            label: "Adoption & Rollout",
            link: {
                type: "generated-index",
                title: "Adoption & Rollout",
                description:
                    "Migration, rollout, and fix-safety guidance for future runtime-cleanup rule adoption.",
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
        },
        {
            className: "sb-cat-presets",
            collapsed: false,
            customProps: {
                badge: "presets",
            },
            type: "category",
            label: "Presets",
            link: {
                type: "doc",
                id: "presets/index",
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
                {
                    className: "sb-cat-rules-cleanup",
                    collapsed: false,
                    customProps: {
                        badge: "rules",
                    },
                    items: [
                        {
                            id: "no-floating-child-processes",
                            label: "no-floating-child-processes",
                            type: "doc",
                        },
                        {
                            id: "no-floating-observers",
                            label: "no-floating-observers",
                            type: "doc",
                        },
                        {
                            id: "no-floating-timers",
                            label: "no-floating-timers",
                            type: "doc",
                        },
                        {
                            id: "no-floating-workers",
                            label: "no-floating-workers",
                            type: "doc",
                        },
                        {
                            id: "no-unmanaged-event-listeners",
                            label: "no-unmanaged-event-listeners",
                            type: "doc",
                        },
                    ],
                    label: "Rules in presets",
                    link: {
                        description:
                            "Stable runtime cleanup rules enabled by the recommended, strict, and all presets.",
                        title: "Rules in presets",
                        type: "generated-index",
                    },
                    type: "category",
                },
            ],
        },
    ],
} satisfies SidebarsConfig;

export default sidebars;
