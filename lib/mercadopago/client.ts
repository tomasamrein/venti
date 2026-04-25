import MercadoPagoConfig, { PreApproval, PreApprovalPlan } from 'mercadopago'

export function getMpClient() {
  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  })
}

export function getPreApprovalPlan() {
  return new PreApprovalPlan(getMpClient())
}

export function getPreApproval() {
  return new PreApproval(getMpClient())
}
