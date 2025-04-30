import { ExternalLink } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { buildTitleFromBreadcrumb } from "~/lib/utils";
import type { Route } from "./+types/writing-nfc-tags";
import { Paragraph } from "./components/Paragraph";
import Section from "./components/Section";
import { SectionHeading } from "./components/SectionHeading";

export const handle = {
  breadcrumb: () => ({ label: "Writing NFC Tags" }),
};

export const meta: Route.MetaFunction = ({ matches }) => {
  return [{ title: buildTitleFromBreadcrumb(matches) }];
};

export default function WritingNfcTags() {
  return (
    <Card className="max-w-prose self-center">
      <CardHeader>
        <CardTitle>Writing NFC Tags</CardTitle>
        <CardDescription>
          This guide will help you set up the device and software you need to
          write to NFC tags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <Section>
          <Paragraph>
            The first thing you need is a physical device that is capable of
            writing NFC tags. While most modern mobile phones have this hardware
            built in, most desktop computers do not. Pick an option below to
            learn more about the options available to you.
          </Paragraph>
          <Paragraph>
            <Button variant="link" asChild className="w-full">
              <Link to="#desktop-computers">
                <Badge variant="default">Recommended</Badge>Desktop Computers
                (Windows/Mac/Linux)
              </Link>
            </Button>
            <Button variant="link" asChild className="w-full">
              <Link to="#mobile-phones">Mobile Phones (Android/iOS)</Link>
            </Button>
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading id="desktop-computers">
            Desktop Computers (Windows/Mac/Linux)
          </SectionHeading>
          <Paragraph>
            Most modern desktop computers do not have NFC hardware built in. You
            will need to use an external NFC writer to write to NFC tags.
          </Paragraph>
          <Paragraph>
            You will also need to download and install software that will
            communicate with the NFC writer. We recommend using{" "}
            <span className="font-bold">NFC Tools for Desktop</span>, which you
            can download at the following link:
          </Paragraph>
          <Paragraph>
            <Button variant="link" asChild className="w-full">
              <Link
                to="https://www.wakdev.com/en/apps/nfc-tools-pc-mac.html"
                target="_blank"
                rel="noreferrer"
              >
                NFC Tools Download (Windows/Mac/Linux) <ExternalLink />
              </Link>
            </Button>
          </Paragraph>
          <Paragraph>
            Once you have your NFC writer connected and NFC Tools installed, now
            you are ready to start programming NFC tags.
          </Paragraph>
          <Paragraph>
            <h4 className="text-sm font-semibold mb-2 mt-4">
              Programming a Tag
            </h4>
            <ol className="list-decimal pl-10">
              <li>
                Connect your NFC writer to your computer via USB before opening
                NFC Tools for Desktop.
              </li>
              <li>Open NFC Tools for Desktop.</li>
              <li>
                From the toolbar at the top, click{" "}
                <span className="font-bold">Write</span>.
              </li>
              <li>
                Below the toolbar, click the{" "}
                <span className="font-bold">Add a Record</span> button.
              </li>
              <li>
                Select <span className="font-bold">Custom URL / URI</span> from
                the dropdown menu.
              </li>
              <li>
                Paste the tag URL generated from the Tag Assistant in the{" "}
                <Link to={"/admin/tags"} className="text-primary underline">
                  admin panel
                </Link>{" "}
                and click <span className="font-bold">OK</span>.
              </li>
              <li>
                Below the toolbar, click the{" "}
                <span className="font-bold">Write</span> button.
              </li>
              <li>Hold the NFC tag you want to write to on the NFC writer.</li>
            </ol>
          </Paragraph>
        </Section>

        <Section>
          <SectionHeading id="mobile-phones">
            Mobile Phones (Android/iOS)
          </SectionHeading>
          <Paragraph>
            Most modern mobile phones have NFC hardware built in. You can use
            your phone to write to NFC tags by downloading an NFC writing app.
          </Paragraph>
          <Paragraph>
            We recommend using the <span className="font-bold">NFC Tools</span>{" "}
            app. You can find it by searching for "NFC Tools" in the Apple App
            Store or Google Play Store.
          </Paragraph>
          <Paragraph>
            <h4 className="text-sm font-semibold mb-2 mt-4">
              Programming a Tag
            </h4>
            <ol className="list-decimal pl-10">
              <li>Open the NFC Tools app.</li>
              <li>
                From the main menu, press{" "}
                <span className="font-bold">Write</span>.
              </li>
              <li>
                On the next menu, press{" "}
                <span className="font-bold">Add a Record</span>.
              </li>
              <li>
                Select <span className="font-bold">Custom URL / URI</span> from
                the list of options.
              </li>
              <li>
                Paste the tag URL generated from the Tag Assistant in the{" "}
                <Link to={"/admin/tags"} className="text-primary underline">
                  admin panel
                </Link>{" "}
                and press <span className="font-bold">OK</span>.
              </li>
              <li>
                On this menu, press <span className="font-bold">Write</span>.
              </li>
              <li>Hold your phone to the NFC tag you want to write to.</li>
            </ol>
          </Paragraph>
        </Section>
      </CardContent>
    </Card>
  );
}
