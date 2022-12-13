import { useForm } from "react-hook-form";
import {
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Button,
  ButtonGroup,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { makeZodI18nMap } from "zod-i18n-map";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation, Trans } from "next-i18next";
import { useRouter } from "next/router";
import { setCookie } from "nookies";
import { MouseEventHandler, useCallback } from "react";

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
  z.setErrorMap(makeZodI18nMap(t));
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const changeLocale = useCallback<MouseEventHandler<HTMLButtonElement>>(
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
    <>
      <ButtonGroup gap={2} mb={4}>
        <Button
          variant={router.locale === "en" ? "outline" : "ghost"}
          colorScheme="teal"
          value="en"
          onClick={changeLocale}
        >
          English
        </Button>
        <Button
          variant={router.locale === "fr" ? "outline" : "ghost"}
          colorScheme="teal"
          value="fr"
          onClick={changeLocale}
        >
          Français
        </Button>
        <Button
          variant={router.locale === "ja" ? "outline" : "ghost"}
          colorScheme="teal"
          value="ja"
          onClick={changeLocale}
        >
          日本語
        </Button>
        <Button
          variant={router.locale === "ar" ? "outline" : "ghost"}
          colorScheme="teal"
          value="ar"
          onClick={changeLocale}
        >
          العربية
        </Button>
        <Button
          variant={router.locale === "pt" ? "outline" : "ghost"}
          colorScheme="teal"
          value="pt"
          onClick={changeLocale}
        >
          Português
        </Button>
        <Button
          variant={router.locale === "zh-CN" ? "outline" : "ghost"}
          colorScheme="teal"
          value="zh-CN"
          onClick={changeLocale}
        >
          简体中文
        </Button>
        <Button
          variant={router.locale === "is" ? "outline" : "ghost"}
          colorScheme="teal"
          value="is"
          onClick={changeLocale}
        >
          Icelandic
        </Button>
      </ButtonGroup>
      <form onSubmit={handleSubmit(console.log)}>
        <FormControl isInvalid={!!errors.username} mb={4}>
          <FormLabel htmlFor="username">
            <Trans>User name</Trans>
          </FormLabel>
          <Input
            id="username"
            placeholder={t("John Doe") ?? undefined}
            {...register("username")}
          />
          <FormErrorMessage>
            {(errors.username?.message ?? "") as string}
          </FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.email} mb={4}>
          <FormLabel htmlFor="email">
            <Trans>Email</Trans>
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
            <Trans>Favorite number</Trans>
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
          <Trans>Submit</Trans>
        </Button>
      </form>
    </>
  );
}
