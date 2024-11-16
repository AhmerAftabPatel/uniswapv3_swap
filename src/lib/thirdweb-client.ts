import { createThirdwebClient } from "thirdweb";

export default createThirdwebClient({
    //@ts-ignore
    clientId: process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID,
});

