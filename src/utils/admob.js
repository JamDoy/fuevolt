import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

const isNative = Capacitor.isNativePlatform();

const BANNER_AD_ID = isNative
  ? 'ca-app-pub-7549230738737699/3496465839'
  : '';

export async function initializeAdMob() {
  if (!isNative) return;

  try {
    await AdMob.initialize({});
    console.log('AdMob initialized');
  } catch (error) {
    console.error('AdMob init error:', error);
  }
}

export async function showBannerAd() {
  if (!isNative) return;

  try {
    await AdMob.showBanner({
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    });
  } catch (error) {
    console.error('Banner ad error:', error);
  }
}

export async function hideBannerAd() {
  if (!isNative) return;

  try {
    await AdMob.hideBanner();
  } catch (error) {
    console.error('Hide banner error:', error);
  }
}
