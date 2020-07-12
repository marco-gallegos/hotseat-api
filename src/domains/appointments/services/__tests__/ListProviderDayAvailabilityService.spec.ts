import FakeAppointmentsRepository from '@domains/appointments/fakes/repositories/FakeAppointmentsRepository';
import FakeUsersRepository from '@domains/users/fakes/repositories/FakeUsersRepository';
import ListProviderDayAvailabilityService from '@domains/appointments/services/ListProviderDayAvailabilityService';

let appointmentsRepository: FakeAppointmentsRepository;
let usersRepository: FakeUsersRepository;
let listProviderDayAvailabilityService: ListProviderDayAvailabilityService;

describe('List Provider Day Availability', () => {
  beforeEach(() => {
    appointmentsRepository = new FakeAppointmentsRepository();
    usersRepository = new FakeUsersRepository();
    listProviderDayAvailabilityService = new ListProviderDayAvailabilityService(
      usersRepository,
      appointmentsRepository,
    );
  });

  it('should list the day availability of a provider', async () => {
    const provider = await usersRepository.create({
      name: 'Jackie Chan Provider',
      email: 'jackiechanprovider@test.com',
      password: 'meaningless password',
    });

    await appointmentsRepository.create({
      date: new Date(2020, 1, 1, 13, 0, 0),
      provider_id: provider.id,
      type: 'HAIR_CARE',
    });

    await appointmentsRepository.create({
      date: new Date(2020, 1, 1, 10, 0, 0),
      provider_id: provider.id,
      type: 'HAIR_WASHING',
    });

    const availability = await listProviderDayAvailabilityService.execute({
      provider_id: provider.id,
      day: 1,
      month: 2,
      year: 2020,
    });

    expect(availability).toEqual(
      expect.arrayContaining([
        {
          hour: 8,
          available: true,
        },
        {
          hour: 10,
          available: false,
        },
        {
          hour: 13,
          available: false,
        },
        {
          hour: 15,
          available: true,
        },
      ]),
    );
  });
});