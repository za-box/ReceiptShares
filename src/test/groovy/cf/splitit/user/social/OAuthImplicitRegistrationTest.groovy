package cf.splitit.user.social

import cf.splitit.MockitoExtension
import cf.splitit.user.dao.UserService
import cf.splitit.user.model.User
import cf.splitit.user.registration.NewUserDTO
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.springframework.social.connect.Connection
import org.springframework.social.connect.UserProfile
import reactor.core.publisher.Mono

import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat
import static org.mockito.ArgumentMatchers.any
import static org.mockito.Mockito.when

@ExtendWith(MockitoExtension)
class OAuthImplicitRegistrationTest {

    @Mock
    private UserService userService
    @Mock
    private User registeredUser
    @Mock
    private Connection connection
    @Mock
    private UserProfile userProfile

    private String id = UUID.randomUUID().toString()

    @InjectMocks
    OAuthImplicitRegistration underTest

    @BeforeEach
    void setup() {
        when(connection.fetchUserProfile()).thenReturn(userProfile)
        when(registeredUser.id).thenReturn(id)
    }

    @Test
    void shouldReturnRegisteredUserEmail() {
        when(userService.registerNewUser(any(NewUserDTO))).thenReturn(Mono.just(registeredUser))

        assertThat(underTest.execute(connection)).isEqualTo(id)
    }

    @Test
    void shouldReturnNullWhenRegistrationFailed() {
        when(userService.registerNewUser(any(NewUserDTO))).thenReturn(Mono.error(new RuntimeException()))

        assertThat(underTest.execute(connection)).isNull()
    }

}