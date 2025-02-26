export type BaseUIComponentProps = {
  className?: string;
};

export interface Role {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  permissions: string[];
  createdOn: string;
  updatedOn: string;
}

export interface Permission {
  id: string;
  name: string;
  friendlyName: string;
  description: string;
  type: "visibility" | "action";
  clientId: string;
}

export interface PermissionsGroup {
  title: string;
  many?: boolean;
  permissions?: Permission[];
  children?: PermissionsGroup[];
  defaultName?: string;
}

export interface GetPermissionsResponse {
  permissionsFlat: Permission[];
  permissions: {
    visibility: PermissionsGroup;
    resources: PermissionsGroup;
  };
}

export interface ClientUser {
  id: string;
  createdOn: string;
  modifiedOn: string;
  idpId: string;
  active: boolean;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phoneNumber?: string;
  username?: string;
  siteExternalId: string;
  clientExternalId: string;
  roleName?: string;
  position?: string;
}
