import { Mail, Phone, type LucideIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-secondary p-4 flex justify-center">
      <div className="w-full max-w-screen-sm bg-secondary p-4 flex flex-col gap-6 justify-center items-center text-center text-secondary-foreground text-sm">
        <img
          src={BANNER_LOGO_LIGHT_URL}
          alt="FC Safety Shield"
          className="h-4 w-auto dark:hidden"
        />
        <img
          src={BANNER_LOGO_DARK_URL}
          alt="FC Safety Shield"
          className="h-4 w-auto hidden dark:block"
        />
        <div>
          <h4 className="font-bold mb-2">Contact Us</h4>
          <ul className="flex flex-col gap-2">
            {footerContactItems.map((item) => (
              <li
                className="flex items-center justify-center gap-1"
                key={item.label}
              >
                <item.icon className="size-4 text-primary" />
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm">
          &copy; {new Date().getFullYear()} FC Safety Shield. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

const BANNER_LOGO_LIGHT_URL =
  "https://content.fc-safety.com/fc_shield_logo_full_05x-light.png";
const BANNER_LOGO_DARK_URL =
  "https://content.fc-safety.com/fc_shield_logo_full_05x-dark.png";

const footerContactItems: {
  label: string;
  href: string;
  icon: LucideIcon;
}[] = [
  {
    label: "sales@fc-safety.com",
    href: "mailto:sales@fc-safety.com",
    icon: Mail,
  },
  { label: "1-877-665-SAFE (7233)", href: "tel:+18776657233", icon: Phone },
];
