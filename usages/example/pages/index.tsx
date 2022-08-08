import { useForm } from "react-hook-form";
import {
  FormErrorMessage,
  FormLabel,
  FormControl,
  Input,
  Button,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { zodI18nMap } from "zod-i18n-map";
import { translation } from "zod-i18n-map/languages/ja";
import i18next from "i18next";

// lng and resources key depend on your locale.
i18next.init({
  lng: "ja",
  resources: {
    ja: { translation },
  },
});
z.setErrorMap(zodI18nMap);

const schema = z.object({
  name: z.string().min(1),
});

export default function HookForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit((d) => console.log(d))}>
      <FormControl isInvalid={!!errors.name}>
        <FormLabel htmlFor="name">First name</FormLabel>
        <Input id="name" placeholder="name" {...register("name")} />
        <FormErrorMessage>{errors.name?.message ?? ""}</FormErrorMessage>
      </FormControl>
      <Button mt={4} colorScheme="teal" isLoading={isSubmitting} type="submit">
        Submit
      </Button>
    </form>
  );
}
