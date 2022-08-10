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
import * as z from "zod";
import { makeZodI18nMap } from "zod-i18n-map";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation, Trans } from "next-i18next";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!, ["common", "zod"])),
    },
  };
};

const schema = z.object({
  nickname: z.string().min(5),
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

  return (
    <>
      <ButtonGroup gap={2} mb={4}>
        <Button
          variant={router.locale === "en" ? "outline" : "ghost"}
          colorScheme="teal"
          onClick={() => router.replace("/", "/", { locale: "en" })}
        >
          English
        </Button>
        <Button
          variant={router.locale === "ja" ? "outline" : "ghost"}
          colorScheme="teal"
          onClick={() => router.replace("/", "/", { locale: "ja" })}
        >
          日本語
        </Button>
      </ButtonGroup>
      <form onSubmit={handleSubmit(console.log)}>
        <FormControl isInvalid={!!errors.nickname} mb={4}>
          <FormLabel htmlFor="nickname">
            <Trans>Nickname</Trans>
          </FormLabel>
          <Input
            id="nickname"
            placeholder={t("John Doe")}
            {...register("nickname")}
          />
          <FormErrorMessage>
            {(errors.nickname?.message ?? "") as string}
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
