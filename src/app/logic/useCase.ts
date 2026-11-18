 
/* eslint-disable react-hooks/rules-of-hooks */
import { type CreateReactUtils } from "@trpc/react-query/shared";
import { useRouter } from "next/navigation";
import { Component, useState } from "react";
import { type AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";

export class UseCase extends Component {
  protected useUtils: CreateReactUtils<AppRouter, unknown> = api.useUtils();
  protected router = useRouter();
  protected isMutatingState = useState(false);
  public isMutating = this.isMutatingState[0];
  public setIsMutating = this.isMutatingState[1];

  constructor() {
    super({});
  }
}
