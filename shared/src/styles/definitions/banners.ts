/**
 * Platform-agnostic banner style definitions.
 * These definitions can be used to create adapters for different platforms.
 */

export type BannerVariant = 'info' | 'warning' | 'success' | 'danger';

export interface BannerDefinition {
  container: {
    paddingHorizontal: number;
    paddingVertical: number;
    marginBottom: number;
    borderLeftWidth: number;
    borderRadius: number;
  };
  text: {
    fontSize: number;
    lineHeight: number;
  };
}

export interface BannerVariantStyles {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}

export const bannerDefinitions = {
  base: {
    container: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderRadius: 4,
    },
    text: {
      fontSize: 14,
      lineHeight: 20,
    },
  } as BannerDefinition,
  variants: {
    info: {
      backgroundColor: 'surfaceLight',
      borderColor: 'info',
      textColor: 'textPrimary',
    } as BannerVariantStyles,
    warning: {
      backgroundColor: 'surfaceLight',
      borderColor: 'warning',
      textColor: 'textPrimary',
    } as BannerVariantStyles,
    success: {
      backgroundColor: 'surfaceLight',
      borderColor: 'success',
      textColor: 'textPrimary',
    } as BannerVariantStyles,
    danger: {
      backgroundColor: 'surfaceLight',
      borderColor: 'danger',
      textColor: 'textPrimary',
    } as BannerVariantStyles,
  },
};
