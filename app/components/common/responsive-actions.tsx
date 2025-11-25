import { DropdownMenuGroup } from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import type { ComponentProps, PropsWithChildren } from "react";
import { Link, type To } from "react-router";
import { Fragment } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "../ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type ButtonProps = ComponentProps<typeof Button>;

interface TAction {
  key: string;
  text: string;
  Icon: LucideIcon;
  linkTo?: To;
  onAction?: () => void;
  disabled?: boolean;
  hide?: boolean;
  variant?: ButtonProps["variant"];
}

interface TActionGroup {
  key: string;
  actions: TAction[];
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}

export default function ResponsiveActions({ actionGroups }: { actionGroups: TActionGroup[] }) {
  return (
    <>
      <ButtonGroup className="hidden sm:flex">
        {actionGroups.map((group) => (
          <ActionButtonGroup key={group.key} actionGroup={group} />
        ))}
      </ButtonGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="inline-flex sm:hidden">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actionGroups.map((group, index) => (
            <DropdownMenuGroup key={group.key}>
              {group.actions
                .filter((action) => !action.hide)
                .map((action) => {
                  const displayContent = (
                    <>
                      <action.Icon />
                      {action.text}
                    </>
                  );

                  return (
                    <DropdownMenuItem
                      key={action.key}
                      onSelect={action.onAction}
                      disabled={action.disabled}
                      asChild={!!action.linkTo}
                    >
                      {!!action.linkTo ? (
                        <Link to={action.linkTo!}>{displayContent}</Link>
                      ) : (
                        displayContent
                      )}
                    </DropdownMenuItem>
                  );
                })}
              {index < actionGroups.length - 1 && <DropdownMenuSeparator />}
            </DropdownMenuGroup>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

const ActionButtonGroup = ({ actionGroup }: { actionGroup: TActionGroup }) => {
  const resolvedActions = actionGroup.actions.filter((action) => !action.hide);

  const defaultSize = actionGroup.size ?? "icon-sm";
  const defaultVariant = actionGroup.variant ?? "secondary";

  return (
    <ButtonGroup key={actionGroup.key}>
      {resolvedActions.map((action, index) => {
        const Comp = action.linkTo
          ? ({ children }: PropsWithChildren) => <Link to={action.linkTo!}>{children}</Link>
          : Fragment;
        const displayContent = (
          <>
            <action.Icon />
            {defaultSize !== "icon" && defaultSize !== "icon-sm" && action.text}
          </>
        );

        return (
          <Fragment key={action.key}>
            <Button
              asChild={!!action.linkTo}
              onClick={action.onAction}
              size={defaultSize}
              variant={action.variant ?? defaultVariant}
              title={action.text}
              disabled={action.disabled}
            >
              {action.linkTo ? <Link to={action.linkTo!}>{displayContent}</Link> : displayContent}
            </Button>
            {index < resolvedActions.length - 1 && <ButtonGroupSeparator />}
          </Fragment>
        );
      })}
    </ButtonGroup>
  );
};
