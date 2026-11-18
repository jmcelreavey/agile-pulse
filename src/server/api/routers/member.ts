import { protectedProcedure } from "~/server/api/procedures";
import {
  CreateMemberSchema,
  DeleteMemberSchema,
  GetAllMembersSchema,
  GetOneMemberSchema,
  UpdateMemberSchema,
} from "~/server/api/schemas/member";
import { createTRPCRouter } from "~/server/api/trpc";
import { CreateDeleteRecordUseCase } from "~/server/logic/common/CreateDeleteRecordUseCase";
import { CreateMemberUseCase } from "~/server/logic/member/CreateMemberUseCase";
import { DeleteMemberUseCase } from "~/server/logic/member/DeleteMemberUseCase";
import { GetAllMembersUseCase } from "~/server/logic/member/GetAllMembersUseCase";
import { GetOneMemberUseCase } from "~/server/logic/member/GetOneMemberUseCase";
import { UpdateMemberUseCase } from "~/server/logic/member/UpdateMemberUseCase";
import { DeleteSource } from "~/shared/types/DeleteSource";

export const memberRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(GetAllMembersSchema)
    .query(async ({ ctx, input }) => {
      const getAllMembers = new GetAllMembersUseCase(ctx.db);
      const members = await getAllMembers.execute(input);
      return members;
    }),
  getOne: protectedProcedure
    .input(GetOneMemberSchema)
    .query(async ({ ctx, input }) => {
      const getOneMember = new GetOneMemberUseCase(ctx.db);
      const member = await getOneMember.execute(input);
      return member;
    }),
  create: protectedProcedure
    .input(CreateMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const createMember = new CreateMemberUseCase(ctx.db);
      const member = await createMember.execute(input);
      return member;
    }),
  update: protectedProcedure
    .input(UpdateMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const updateMember = new UpdateMemberUseCase(ctx.db);
      const member = await updateMember.execute(input);
      return member;
    }),
  delete: protectedProcedure
    .input(DeleteMemberSchema)
    .mutation(async ({ ctx, input }) => {
      const deleteMember = new DeleteMemberUseCase(ctx.db);
      const deleteRecord = await new CreateDeleteRecordUseCase(ctx.db).execute({
        reason: input.reason,
        source: DeleteSource.MEMBER,
        sourceId: input.id,
      });

      const deletedRecord = await deleteMember.execute({
        ...input,
        deletedRecordId: deleteRecord.id,
      });

      return deletedRecord;
    }),
});
