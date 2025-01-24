import { Collapsible } from "@radix-ui/react-collapsible";
import Fuse from "fuse.js";
import { BookOpenText, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Input } from "~/components/ui/input";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/faqs";

export const handle = {
  breadcrumb: () => ({ label: "FAQs" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

interface Faq {
  question: string;
  answer: string;
}

interface FaqCategory {
  category: string;
  questions: Faq[];
}

const faqs: FaqCategory[] = [
  {
    category: "General Questions",
    questions: [
      {
        question: "What is Shield, and who is it for?",
        answer:
          "Shield, owned by FC Safety, is a platform designed to aid organizations in maintaining compliance for health equipment such as AEDs, fire extinguishers, and first aid cabinets. It is ideal for businesses with site inspectors, site coordinators, or administrators responsible for equipment compliance.",
      },
      {
        question: "How does Shield help with compliance?",
        answer:
          "Shield helps manage assets, perform inspections, view alerts related to inspection issues, track inspection statuses, and reorder supplies needed for equipment maintenance.",
      },
      {
        question: "What types of health equipment can Shield manage?",
        answer:
          "Shield supports AEDs, fire extinguishers, first aid cabinets, and other similar equipment categories. You can also customize product categories based on your organization’s needs.",
      },
      {
        question: "How does NFC tagging work for inspections?",
        answer:
          "Each asset has an NFC tag. Inspectors scan the tag with their phone to open the inspection page, where they can answer questions and update the asset's status in real-time.",
      },
    ],
  },
  {
    category: "For Site Inspectors",
    questions: [
      {
        question: "How do I perform an inspection?",
        answer:
          "Simply scan the NFC tag on the asset with your mobile device. This will open the inspection page where you can answer specific questions about the asset’s condition.",
      },
      {
        question:
          "What happens if I answer 'No' to a question like 'Is the green light working?'",
        answer:
          "If certain critical questions are answered negatively, an alert is automatically generated. Coordinators can then take the necessary steps to address the issue.",
      },
    ],
  },
  {
    category: "For Site Coordinators",
    questions: [
      {
        question: "What can I do as a site coordinator?",
        answer:
          "As a site coordinator, you can: View and manage assets, monitor inspection statuses and alerts, take action on issues flagged by inspectors, and reorder supplies like AED pads and batteries when needed.",
      },
      {
        question: "How do I view inspection statuses for my site?",
        answer:
          "Go to the Inspection Status section in your dashboard. You’ll see a timeline and current compliance status for all assets.",
      },
      {
        question: "How do I manage alerts?",
        answer:
          "Alerts are listed in the Alerts section. Each alert contains details about the issue, such as the specific asset and the inspection question that triggered it. You can assign follow-up tasks or mark alerts as resolved.",
      },
    ],
  },
  {
    category: "For Site Group Coordinators",
    questions: [
      {
        question:
          "What additional functionality do I have compared to site coordinators?",
        answer:
          "As a site group coordinator, you can manage multiple sites. This includes viewing all assets, inspections, and alerts across your assigned sites, making it easier to ensure organization-wide compliance.",
      },
      {
        question: "Can I filter inspection reports by site?",
        answer:
          "Yes, you can use the Filters feature in the inspection dashboard to narrow results by specific sites, timeframes, or equipment types.",
      },
    ],
  },
  {
    category: "For Client Admins",
    questions: [
      {
        question: "What capabilities do client admins have?",
        answer:
          "As a client admin, you have the highest level of access, allowing you to: Manage assets, inspections, and alerts across all sites under your organization, view and create products, product categories, and manufacturers to align with your organizational needs.",
      },
      {
        question: "How do I add a new product or manufacturer?",
        answer:
          "Go to the Product Management section and select Add New Product or Add Manufacturer. Fill out the necessary details and save your changes.",
      },
      {
        question: "Can I customize inspection questions for my organization?",
        answer:
          "Yes, client admins can work with FC Safety’s support team to customize inspection questions to meet specific organizational or regulatory requirements.",
      },
    ],
  },
  {
    category: "Supply Management",
    questions: [
      {
        question: "How can I reorder supplies for assets?",
        answer:
          "In the Assets section, select the asset requiring supplies. You’ll see a Reorder Supplies button for items like AED pads or batteries. Complete the order form, and the request will be processed.",
      },
      {
        question: "Can I track supply orders?",
        answer:
          "Yes, in the Orders section, you can view all supply orders, their status (e.g., processing, shipped), and estimated delivery dates.",
      },
    ],
  },
  {
    category: "Technical Support",
    questions: [
      {
        question: "What should I do if I have trouble scanning an NFC tag?",
        answer:
          "Ensure your phone has NFC enabled. If the issue persists, check the NFC tag for physical damage or contact FC Safety support for assistance.",
      },
      {
        question: "How can I reset my password?",
        answer:
          "Click the Forgot Password link on the login page, and follow the instructions to reset your password.",
      },
      {
        question: "Who do I contact for support?",
        answer:
          "For assistance, contact FC Safety’s support team at [Support Email] or [Support Phone Number].",
      },
    ],
  },
  {
    category: "Customization & Integration",
    questions: [
      {
        question: "Can I integrate Shield with other systems?",
        answer:
          "Shield supports integrations with other compliance and asset management systems. Contact FC Safety for details on available integrations and setup assistance.",
      },
      {
        question: "How can I customize Shield for my organization?",
        answer:
          "Client admins can customize product categories, inspection questions, and more. Contact FC Safety’s support team for advanced customization options.",
      },
    ],
  },
];

export const loader = () => {
  return {
    faqs,
  };
};

const filterFaqs = (
  category: FaqCategory,
  search: string
): {
  category: FaqCategory | null;
  open: boolean;
} => {
  if (!search) {
    return {
      category,
      open: false,
    };
  }

  const fuse = new Fuse(category.questions, {
    keys: ["question", "answer"],
    // includeMatches: true,
    threshold: 0.2,
    minMatchCharLength: 3,
    ignoreLocation: true,
  });
  const results = fuse.search(search);

  if (!results.length) {
    return {
      category: null,
      open: false,
    };
  }

  return {
    category: {
      ...category,
      questions: results.map((result) => result.item),
    },
    open: true,
  };
};

export default function Faqs({ loaderData: { faqs } }: Route.ComponentProps) {
  const [search, setSearch] = useState("");
  const filteredFaqs = useMemo(
    () =>
      faqs
        .map((faq) => filterFaqs(faq, search))
        .filter(
          (
            faq
          ): faq is typeof faq & {
            category: Exclude<(typeof faq)["category"], null>;
          } => !!faq.category
        ),
    [faqs, search]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <BookOpenText /> FAQs
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        <Input
          placeholder="Search FAQs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {filteredFaqs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No results found for &quot;{search}&quot;
          </p>
        )}
        {filteredFaqs.map(({ category, open }) => {
          return (
            <div
              key={`${category.category}--open-${open}`}
              className="grid gap-2"
            >
              <h3 className="text-base font-semibold text-primary">
                {category.category}
              </h3>
              {category.questions.map((faq) => (
                <Collapsible
                  key={faq.question}
                  defaultOpen={open}
                  className="group/collapsible"
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="secondary" className="w-full">
                      {faq.question}
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 my-4 text-sm font-light">
                    {faq.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
