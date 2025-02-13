export const extractErrorMessage = async (error: unknown) => {
  if (error instanceof Response) {
    if (error.status >= 400 && error.status < 500) {
      const errMsgString = await error.text();
      let errMsgRaw: unknown = errMsgString;
      if (error.headers.get("content-type")?.includes("application/json")) {
        errMsgRaw = JSON.parse(errMsgString);
      }

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

      const errMsg = Array.isArray(errMsgRaw)
        ? errMsgRaw.map(cleanErrMsg)
        : cleanErrMsg(errMsgRaw);

      return errMsg;
    }
  }

  return null;
};
