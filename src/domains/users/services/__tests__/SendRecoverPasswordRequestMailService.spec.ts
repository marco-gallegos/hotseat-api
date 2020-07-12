import FakeUsersRepository from '@domains/users/fakes/repositories/FakeUsersRepository';
import SendRecoverPasswordRequestMailService from '@domains/users/services/SendRecoverPasswordMailService';
import FakeMailProvider from '@shared/container/providers/MailProvider/fakes/FakeMailProvider';
import AppError from '@shared/errors/AppError';
import FakeRecoverPasswordRequestsRepository from '@domains/users/fakes/repositories/FakeRecoverPasswordRequestsRepository';
import { addHours } from 'date-fns';
import { RESET_PASSWORD_REQUEST_EXPIRES_IN_HOURS } from '@domains/users/constants/resetPassword';

let mailProvider: FakeMailProvider;

let usersRepository: FakeUsersRepository;
let recoverPasswordRequestRepository: FakeRecoverPasswordRequestsRepository;

let sendRecoverPasswordMailService: SendRecoverPasswordRequestMailService;

describe('Send Recover Password Mail', () => {
  beforeEach(() => {
    mailProvider = new FakeMailProvider();

    recoverPasswordRequestRepository = new FakeRecoverPasswordRequestsRepository();
    usersRepository = new FakeUsersRepository();

    sendRecoverPasswordMailService = new SendRecoverPasswordRequestMailService(
      mailProvider,
      usersRepository,
      recoverPasswordRequestRepository,
    );
  });

  it('should be able to send recover password request email', async () => {
    const userData = {
      name: 'Jackie Chan',
      email: 'jackiechanwrongemail@test.com',
      password: 'meaningless password',
    };

    const { email } = await usersRepository.create(userData);

    const sendMail = jest.spyOn(mailProvider, 'sendMail');

    await sendRecoverPasswordMailService.execute({ email });

    expect(sendMail).toHaveBeenCalled();
  });

  it('should not be able to send mails to unexisting users', async () => {
    await expect(
      sendRecoverPasswordMailService.execute({
        email: 'unexistinguser@test.com',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('should be able to create a token based on the user id', async () => {
    const { id, email } = await usersRepository.create({
      name: 'Jackie Chan',
      email: 'jackiechan@test.com',
      password: 'meaningless password',
    });

    const createToken = jest.spyOn(recoverPasswordRequestRepository, 'create');

    await sendRecoverPasswordMailService.execute({ email });

    expect(createToken).toHaveBeenCalledWith(id);
  });

  it('should be able to create a expire date of two hours', async () => {
    const { id } = await usersRepository.create({
      name: 'Jackie Chan',
      email: 'jackiechan@test.com',
      password: 'meaningless password',
    });

    const now = Date.now();
    jest.spyOn(Date, 'now').mockImplementationOnce(() => now);

    const request = await recoverPasswordRequestRepository.create(id);

    expect(request?.expires_at).toEqual(
      addHours(now, RESET_PASSWORD_REQUEST_EXPIRES_IN_HOURS),
    );
  });
});