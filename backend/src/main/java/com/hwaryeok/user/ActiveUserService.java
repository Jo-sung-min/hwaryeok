package com.hwaryeok.user;

import com.hwaryeok.auth.InvalidCredentialsException;
import com.hwaryeok.common.error.ForbiddenOperationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ActiveUserService {

    private final UserRepository userRepository;

    public ActiveUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User requireActive(String userId) {
        return validate(userRepository.findById(userId).orElseThrow(InvalidCredentialsException::new));
    }

    @Transactional
    public User requireActiveForUpdate(String userId) {
        return validate(userRepository.findByIdForUpdate(userId).orElseThrow(InvalidCredentialsException::new));
    }

    @Transactional(readOnly = true)
    public User requireAdmin(String userId) {
        User user = requireActive(userId);
        if (!"ADMIN".equals(user.getRole())) {
            throw new ForbiddenOperationException("관리자 권한이 필요해요.");
        }
        return user;
    }

    private User validate(User user) {
        if (!"ACTIVE".equals(user.getStatus())) throw new InvalidCredentialsException();
        return user;
    }
}
