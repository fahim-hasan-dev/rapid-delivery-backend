export type IVerifyEmail = {
  email: string
  oneTimeCode: number
}

// Login credentials for both email and phone based authentication
export type ILoginData = {
  password: string
  email?: string
  phone?: string
  fcmToken?: string
}


export type IAuthResetPassword = {
  newPassword: string
  confirmPassword: string
}

export type IChangePassword = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
