import { useForm } from "react-hook-form";
import {
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Button,
  Select,
  InputGroup,
  InputLeftAddon,
  Container,
  Flex,
  Heading,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { makeZodI18nMap } from "zod-i18n-map";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation, Trans } from "next-i18next";
import { useRouter } from "next/router";
import { setCookie } from "nookies";
import { ChangeEventHandler, useCallback } from "react";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ["common", "zod"])),
    },
  };
};

const schema = z.object({
  username: z.string().min(5),
  email: z.string().email(),
  favoriteNumber: z.number().max(10).min(1),
});

export default function HookForm() {
  const { t } = useTranslation();
  z.setErrorMap(makeZodI18nMap({ t, handlePath: { ns: ["common", "zod"] } }));
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const changeLocale = useCallback<ChangeEventHandler<HTMLSelectElement>>(
    (e) => {
      const locale = e.currentTarget.value;
      setCookie(null, "NEXT_LOCALE", locale);
      router.replace("/", "/", { locale }).then(() => {
        router.reload();
      });
    },
    [router.replace, router.reload]
  );

  return (
    <Container maxW="container.xl">
      <Flex as="header" py="4" justifyContent="space-between">
        <a href="https://github.com/aiji42/zod-i18n" rel="noopener noreferrer">
          <Heading as="h1" fontSize="xl" color="gray.600">
            zod-i18n
          </Heading>
        </a>
        <InputGroup maxW="3xs">
          <InputLeftAddon>🌐</InputLeftAddon>
          <Select
            defaultValue={router.locale}
            onChange={changeLocale}
            borderLeftRadius={0}
          >
            {/* Please list the options in the order of locale codes. */}
            <option value="ar">العربية</option>
            <option value="bg">Български</option>
            <option value="cs">Čeština</option>
            <option value="de">Deutsch</option>
            <option value="en">English</option>
            <option value="es">español</option>
            <option value="fa">فارسی</option>
            <option value="fi">suomi</option>
            <option value="fr">Français</option>
            <option value="he">עברית</option>
            <option value="hr-HR">Hrvatski</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="is">íslenskur</option>
            <option value="it">italiano</option>
            <option value="ja">日本語</option>
            <option value="ka">ქართული</option>
            <option value="ko">한국어</option>
            <option value="lt">Lietuvių</option>
            <option value="nb">Norsk bokmål</option>
            <option value="nl">Nederlands</option>
            <option value="pl">polski</option>
            <option value="pt">Português</option>
            <option value="ro">Română</option>
            <option value="ru">Русский</option>
            <option value="sk">Slovenčina</option>
            <option value="sv">Swedish</option>
            <option value="tr">Türkçe</option>
            <option value="uk-UA">Українська</option>
            <option value="uz">O‘zbekcha</option>
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
          </Select>
        </InputGroup>
      </Flex>
      <form onSubmit={handleSubmit(console.log)}>
        <FormControl isInvalid={!!errors.username} mb={4}>
          <FormLabel htmlFor="username">
            <Trans>username</Trans>
          </FormLabel>
          <Input
            id="username"
            placeholder={t("username_placeholder") ?? undefined}
            {...register("username")}
          />
          <FormErrorMessage>
            {(errors.username?.message ?? "") as string}
          </FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.email} mb={4}>
          <FormLabel htmlFor="email">
            <Trans>email</Trans>
          </FormLabel>
          <Input
            id="email"
            placeholder="foo@example.com"
            {...register("email")}
          />
          <FormErrorMessage>
            {(errors.email?.message ?? "") as string}
          </FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.favoriteNumber} mb={4}>
          <FormLabel htmlFor="favoriteNumber">
            <Trans>favoriteNumber</Trans>
          </FormLabel>
          <Input
            id="favoriteNumber"
            {...register("favoriteNumber", { setValueAs: Number })}
          />
          <FormErrorMessage>
            {(errors.favoriteNumber?.message ?? "") as string}
          </FormErrorMessage>
        </FormControl>
        <Button
          mt={4}
          colorScheme="teal"
          isLoading={isSubmitting}
          type="submit"
        >
          <Trans>submit</Trans>
        </Button>
      </form>
    </Container>
  );
}
