export const assetTypes = [
  "Camera",
  "Sensor",
  "Router",
  "Switch",
  "Server",
] as const;
export const assetSites = [
  "NYC",
  "San Francisco",
  "Los Angeles",
  "Chicago",
  "Dallas",
] as const;
export const assetStatuses = ["ok", "warning", "error"] as const;
export const assetLocations = [
  "Warehouse A",
  "Warehouse B",
  "Data Center 1",
  "Office Floor 3",
  "Rooftop",
] as const;
export const assetManufacturers = [
  "Sony",
  "Cisco",
  "Panasonic",
  "Siemens",
  "Dell",
] as const;

export type Asset = {
  id: string;
  active: boolean;
  type: (typeof assetTypes)[number];
  tag: string;
  site: (typeof assetSites)[number];
  location: string;
  placement: string;
  manufactuer: (typeof assetManufacturers)[number];
  status: (typeof assetStatuses)[number];
};

function generateDemoAssets(count: number) {
  const placements = ["Indoor", "Outdoor", "Ceiling", "Wall", "Rack"];

  const assets = [];

  for (let i = 0; i < count; i++) {
    const id = `ASSET-${1000 + i}`;
    const type = assetTypes[Math.floor(Math.random() * assetTypes.length)];
    const tag = `TAG-${Math.floor(Math.random() * 10000)}`;
    const site = assetSites[Math.floor(Math.random() * assetSites.length)];
    const location =
      assetLocations[Math.floor(Math.random() * assetLocations.length)];
    const placement = placements[Math.floor(Math.random() * placements.length)];
    const manufacturer =
      assetManufacturers[Math.floor(Math.random() * assetManufacturers.length)];
    const status =
      assetStatuses[Math.floor(Math.random() * assetStatuses.length)];

    assets.push({
      id,
      active: true,
      type,
      tag,
      site,
      location,
      placement,
      manufactuer: manufacturer,
      status,
    });
  }

  return assets as Asset[];
}

export const demoAssets = generateDemoAssets(100);

export interface AssetHistoryLog {
  id: string;
  timestamp: Date;
  action: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
  details: string;
}

export const demoUsers = [
  {
    id: "U001",
    name: "Alice Johnson",
    username: "alicej",
    email: "alicej@example.com",
  },
  {
    id: "U002",
    name: "Bob Smith",
    username: "bobsmith",
    email: "bobsmith@example.com",
  },
  {
    id: "U003",
    name: "Charlie Brown",
    username: "charlieb",
    email: "charlieb@example.com",
  },
  {
    id: "U004",
    name: "Dana White",
    username: "danaw",
    email: "danaw@example.com",
  },
  {
    id: "U005",
    name: "Evan Green",
    username: "evang",
    email: "evang@example.com",
  },
  {
    id: "U006",
    name: "Frank Brown",
    username: "frankb",
    email: "frankb@example.com",
  },
  {
    id: "U007",
    name: "Grace White",
    username: "gracew",
    email: "gracew@example.com",
  },
  {
    id: "U008",
    name: "Hank Green",
    username: "hankg",
    email: "hankg@example.com",
  },
  {
    id: "U009",
    name: "Ivan Brown",
    username: "ivanb",
    email: "ivanb@example.com",
  },
  {
    id: "U010",
    name: "Jack White",
    username: "jackw",
    email: "jackw@example.com",
  },
  {
    id: "U011",
    name: "Larry Green",
    username: "larryg",
    email: "larryg@example.com",
  },
];

function generateDemoAssetHistoryLogs(count: number) {
  const actions = ["created", "updated", "deleted", "moved", "inspected"];
  const detailsTemplates = [
    "Asset was {action} by {username}.",
    "Performed {action} on asset.",
    "{username} {action} asset at {timestamp}.",
    "User {name} ({username}) {action} the asset.",
    "Action: {action} performed by {username}.",
  ];

  const logs = [];

  for (let i = 0; i < count; i++) {
    const id = `LOG-${i + 1}`;
    const timestamp = new Date(
      Date.now() - Math.floor(Math.random() * 10000000000)
    );
    const action = actions[Math.floor(Math.random() * actions.length)];
    const user = demoUsers[Math.floor(Math.random() * demoUsers.length)];
    const detailsTemplate =
      detailsTemplates[Math.floor(Math.random() * detailsTemplates.length)];
    const details = detailsTemplate
      .replace("{action}", action)
      .replace("{username}", user.username)
      .replace("{name}", user.name)
      .replace("{timestamp}", timestamp.toISOString());

    logs.push({
      id,
      timestamp,
      action,
      user,
      details,
    });
  }

  return logs;
}

export const demoAssetHistoryLogs: AssetHistoryLog[] =
  generateDemoAssetHistoryLogs(100);
