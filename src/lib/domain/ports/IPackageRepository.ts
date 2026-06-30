import { Package, PackageOption } from '@/types';

export interface IPackageRepository {
  getPackageOptions(): Promise<PackageOption[]>;
  getPackages(parentId: string): Promise<Package[]>;
  getLatestPackage(parentId: string): Promise<Package | null>;
  grantTrialPackage(parentId: string): Promise<void>;
  submitTopUp(
    parentId: string,
    packageType: string,
    slipFile: File | null,
    nonRefundable: boolean
  ): Promise<Record<string, unknown> | null>;
}
