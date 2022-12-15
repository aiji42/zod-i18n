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
  z.setErrorMap(makeZodI18nMap(t));
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
    <>
      <InputGroup>
        <InputLeftAddon children="🌐" />
        <Select
          defaultValue={router.locale}
          onChange={changeLocale}
          mb={8}
          borderLeftRadius={0}
        >
          <option value="ar">العربية</option>
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="is">Icelandic</option>
          <option value="ja">日本語</option>
          <option value="pt">Português</option>
          <option value="zh-CN">简体中文</option>
        </Select>
      </InputGroup>
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
