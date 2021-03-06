package cf.splitit.security.limit;

import cf.splitit.user.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.HandlerInterceptor;
import reactor.core.publisher.Mono;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Slf4j
public class RateLimitHandlerInterceptor implements HandlerInterceptor {

    private final RateLimit rateLimit;

    public RateLimitHandlerInterceptor(RateLimit rateLimit) {
        this.rateLimit = rateLimit;
    }


    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String remoteId = findRemoteId(request);
        return rateLimit.checkRate(remoteId)
                 .then(Mono.just(true))
                 .onErrorResume(RateLimitException.class, e -> handleRateLimitError(remoteId, request, response, e))
                 .block();
    }

    private Mono<Boolean> handleRateLimitError(String remoteId, HttpServletRequest request, HttpServletResponse response, RateLimitException exception)  {
        log.error("Too many requests from " + remoteId);
        try {
            //TODO: should return error without processing handler
            //It seems that action takes place even if rate limit exceeded
            exception.retryAfter().ifPresent(after -> response.setHeader("Retry-After", after.toString()));
            if (!response.isCommitted()) {
                response.sendError(HttpStatus.TOO_MANY_REQUESTS.value());
            } else {
                log.warn("Can't set error status code, response is commited. URL: " + request.getRequestURL());
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return Mono.just(false);
    }

    private String findRemoteId(HttpServletRequest request) {
        if (request.getUserPrincipal() != null && request.getUserPrincipal() instanceof User) {
            return ((User) request.getUserPrincipal()).getPerson().getId();
        }
        return request.getRemoteAddr();
    }
}
