import type { AppProps } from "next/app";
import { Box, ChakraProvider } from "@chakra-ui/react";
import { appWithTranslation } from "next-i18next";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider>
      <Box p={4}>
        <Component {...pageProps} />
      </Box>
    </ChakraProvider>
  );
}

export default appWithTranslation(MyApp);
