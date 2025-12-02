export const getErrorOrExtractResponseErrorMessage = async (error: unknown) => {
  if (error instanceof Response) {
    if (error.status >= 400 && error.status < 500) {
      const errMsgString = await error.text();
      let errMsgRaw: unknown = errMsgString;
      if (error.headers.get("content-type")?.includes("application/json")) {
        errMsgRaw = JSON.parse(errMsgString);
      }

      return errMsgRaw;
    }
  }

  if (typeof error === "string") {
    try {
      return JSON.parse(error);
    } catch {
      // do nothing;
    }
  }

  return error;
};

export const cleanErrorMessage = (error: unknown) => {
  const cleanErrMsg = (err: unknown) => {
    if (typeof err === "object" && err !== null) {
      if ("message" in err) {
        return String(err.message);
      }
      if ("error" in err) {
        return String(err.error);
      }
      return JSON.stringify(err, null, 2);
    }
    return String(err).replace(/^./, (str) => str.toUpperCase());
  };

  const errMsg = Array.isArray(error) ? error.map(cleanErrMsg) : cleanErrMsg(error);

  return errMsg;
};

export const asString = (strOrArray: string | string[]) => {
  if (Array.isArray(strOrArray)) {
    return strOrArray.join("\n");
  }
  return strOrArray;
};
