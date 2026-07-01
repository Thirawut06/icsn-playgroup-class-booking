import { Parent, Child, ParentWithDetails, SubmitChildPayload } from '@/types';

export interface IParentRepository {
  getParentByPhone(phone: string): Promise<Parent | null>;
  loginParent(phone: string): Promise<Parent>;
  signUp(email: string, password: string, name: string, phone: string): Promise<Parent>;
  signIn(email: string, password: string): Promise<Parent>;
  completeProfile(userId: string, name: string, phone: string): Promise<Parent>;
  getParentDetails(parentId: string): Promise<ParentWithDetails | null>;
  getChildren(parentId: string): Promise<Child[]>;
  uploadFile(bucket: string, file: File, path: string): Promise<string>;
  submitNewChild(payload: SubmitChildPayload): Promise<Child>;
}
