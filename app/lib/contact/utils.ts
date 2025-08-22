export const showChat = () => {
  const beaconContainer = document.querySelector<HTMLDivElement>("#beacon-container");
  if (beaconContainer) {
    beaconContainer.style.opacity = "1";
    beaconContainer.style.pointerEvents = "auto";
  }
};

export const openChat = () => {
  showChat();
  (window as any).Beacon("open");
};

export const closeChat = () => {
  (window as any).Beacon("close");
};

export const hideChat = () => {
  closeChat();
  const beaconContainer = document.querySelector<HTMLDivElement>("#beacon-container");
  if (beaconContainer) {
    beaconContainer.style.opacity = "0";
    beaconContainer.style.pointerEvents = "none";
  }
};
