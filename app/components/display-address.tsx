import type { Address } from "~/lib/models";

export default function DisplayAddress({ address }: { address: Address }) {
  return <p className="whitespace-pre-wrap">{displayAddressString(address)}</p>;
}

const displayAddressString = (address: Address) => {
  let result = address.street1;

  if (address.street2) {
    result += `\n${address.street2}`;
  }

  if (address.city) {
    result += `\n${address.city}`;

    if (address.state) {
      result += `, ${address.state}`;
    }

    if (address.zip) {
      result += ` ${address.zip}`;
    }
  } else if (address.state) {
    result += `\n${address.state}`;
  }

  if (address.county) {
    result += `\n${address.county}`;
  }

  if (address.country) {
    result += `\n${address.country}`;
  }

  return result;
};
