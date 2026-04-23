import type { Sm2PublicKeyResponse } from '@/types/crypto/Sm2PublicKeyResponse'
import type { ApiResponse } from '@/types/ApiResponse'
import httpInstance from '@/utils/request/http'

/**
 * 获取SM2加密公钥
 * @returns SM2公钥响应
 */
export const getSm2PublicKey = (): Promise<ApiResponse<Sm2PublicKeyResponse>> => {
  return httpInstance.get('/crypto/sm2/public-key')
}
