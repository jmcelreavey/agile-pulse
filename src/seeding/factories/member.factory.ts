import { SeedingFactory } from "~/seeding/factories/factory";
import {
  type CreateMemberType,
  type DeleteMemberInputType,
  type UpdateMemberType,
} from "~/server/api/schemas/member";

export type CreateMemberRecipe = Partial<CreateMemberType>;
export type UpdateMemberRecipe = Partial<UpdateMemberType>;
export type RemoveMemberRecipe = Partial<DeleteMemberInputType>;

export const memberFactory = {
  createMember: SeedingFactory.make(
    async ({ faker, api }, recipe?: CreateMemberRecipe) => {
      const memberRecipe = {
        name: recipe?.name ?? faker.person.fullName(),
      };

      const member = await api.member.create({
        ...memberRecipe,
      });

      return member;
    }
  ),

  updateMember: SeedingFactory.make(
    async ({ faker, api }, recipe?: UpdateMemberRecipe) => {
      if (!recipe?.id) {
        throw new Error("Member ID is required for updating a member.");
      }

      const memberRecipe = {
        id: recipe.id,
        name: recipe.name ?? faker.person.firstName(),
      };

      const member = await api.member.update({
        ...memberRecipe,
      });

      return member;
    }
  ),

  delete: SeedingFactory.make(
    async ({ faker, api }, recipe?: RemoveMemberRecipe) => {
      if (!recipe?.id) {
        throw new Error("Member ID is required for removing a member.");
      }

      const deleteRecipe = {
        id: recipe.id,
        reason: recipe.reason ?? faker.music.songName(),
      };

      const member = await api.member.delete({
        ...deleteRecipe,
      });

      return member;
    }
  ),
};
