import { beautifyPhone } from "~/lib/utils";
import DataList from "../data-list";
import { CardContent, CardHeader, CardTitle } from "../ui/card";

import { format } from "date-fns";
import { Boxes, Pencil, Warehouse } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { ViewContext } from "~/.server/api-utils";
import { useAuth } from "~/contexts/auth-context";
import useConfirmAction from "~/hooks/use-confirm-action";
import { useModalFetcher } from "~/hooks/use-modal-fetcher";
import type { Site } from "~/lib/models";
import { can, isSuperAdmin } from "~/lib/users";
import ConfirmationDialog from "../confirmation-dialog";
import { CopyableText } from "../copyable-text";
import DisplayAddress from "../display-address";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import EditSiteButton from "./edit-site-button";

export default function SiteDetailsCard({
  isSiteGroup,
  site,
  viewContext,
}: {
  isSiteGroup: boolean;
  site: Site;
  viewContext?: ViewContext;
}) {
  const { user } = useAuth();
  const userIsSuperAdmin = isSuperAdmin(user);
  const canUpdateSite = can(user, "update", "sites");
  const canDeleteSite = site.externalId !== user.siteId && can(user, "delete", "sites");

  const navigate = useNavigate();

  const { submitJson: submitDelete } = useModalFetcher({
    defaultErrorMessage: "Error: Failed to delete site",
    onSubmitted: () => {
      navigate(`../`);
    },
  });

  const [deleteSiteAction, setDeleteSiteAction] = useConfirmAction({
    variant: "destructive",
    defaultProps: {
      title: "Delete Site",
    },
  });

  return (
    <>
      <Card className="h-max">
        <CardHeader>
          <CardTitle>
            {isSiteGroup ? <Boxes /> : <Warehouse />}
            <div className="inline-flex items-center gap-4">
              Site {isSiteGroup ? "Group " : ""}Details
              <div className="flex gap-2">
                {canUpdateSite && (
                  <EditSiteButton
                    site={site}
                    clientId={site.clientId}
                    trigger={
                      <Button variant="secondary" size="icon" type="button">
                        <Pencil />
                      </Button>
                    }
                    isSiteGroup={isSiteGroup}
                    viewContext="admin"
                  />
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8">
          <div className="grid gap-4">
            <Label>Properties</Label>
            <DataList
              details={[
                {
                  label: "Name",
                  value: site.name,
                },
                {
                  label: "External ID",
                  value: <CopyableText text={site.externalId} />,
                  hidden: !userIsSuperAdmin,
                },
                {
                  label: "Is Primary Site",
                  value: site.primary ? "Yes" : "No",
                  hidden: isSiteGroup,
                },
                {
                  label: "Parent Site",
                  value: (
                    <Button variant="link" className="h-auto p-0 px-0 py-0">
                      <Link to={`../sites/${site.parentSiteId}`}>{site.parentSite?.name}</Link>
                    </Button>
                  ),
                  hidden: !site.parentSite,
                },
              ]}
              variant="thirds"
            />
          </div>
          <div className="grid gap-4">
            <Label>Contact</Label>
            <DataList
              details={[
                {
                  label: "Address",
                  value: <DisplayAddress address={site.address} />,
                },
                {
                  label: "Phone Number",
                  value: beautifyPhone(site.phoneNumber),
                },
              ]}
              defaultValue={<>&mdash;</>}
              variant="thirds"
            />
          </div>
          <div className="grid gap-4">
            <Label>Other</Label>
            <DataList
              details={[
                {
                  label: "Created",
                  value: format(site.createdOn, "PPpp"),
                },
                {
                  label: "Last Updated",
                  value: format(site.modifiedOn, "PPpp"),
                },
              ]}
              defaultValue={<>&mdash;</>}
              variant="thirds"
            />
          </div>
          {canDeleteSite && (
            <Alert variant="destructive">
              <AlertTitle>Danger Zone</AlertTitle>
              <AlertDescription className="flex flex-col items-start gap-2">
                <p>
                  Deleting this site may not be permitted if it is already in use and has data
                  associated with it.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  type="button"
                  onClick={() =>
                    setDeleteSiteAction((draft) => {
                      draft.open = true;
                      draft.message = `Are you sure you want to delete "${site.name}"?`;
                      draft.requiredUserInput = site.name;
                      draft.onConfirm = () => {
                        submitDelete(
                          {},
                          {
                            method: "delete",
                            path: `/api/proxy/sites/${site.id}`,
                            viewContext,
                          }
                        );
                      };
                    })
                  }
                >
                  Delete Site
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      <ConfirmationDialog {...deleteSiteAction} />
    </>
  );
}
