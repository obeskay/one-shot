package jobs

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"

	"shotgun/internal/domain"
)

// Manager gestiona trabajos asincronicos
type Manager struct {
	mu   sync.RWMutex
	jobs map[string]*domain.Job
}

// NewManager crea un nuevo manager de jobs
func NewManager() *Manager {
	return &Manager{
		jobs: make(map[string]*domain.Job),
	}
}

// CreateJob crea un nuevo job
func (m *Manager) CreateJob(kind domain.JobKind) (*domain.Job, context.Context) {
	ctx, cancel := context.WithCancel(context.Background())

	job := &domain.Job{
		ID:        uuid.New().String(),
		Kind:      kind,
		State:     domain.JobStateQueued,
		StartedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
		Cancel:    cancel,
	}

	m.mu.Lock()
	m.jobs[job.ID] = job
	m.mu.Unlock()

	return job, ctx
}

// GetJob obtiene un job por ID
func (m *Manager) GetJob(id string) *domain.Job {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.jobs[id]
}

// UpdateJob actualiza el estado de un job
func (m *Manager) UpdateJob(id string, state domain.JobState, stage string, current, total int64, msg string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	job, ok := m.jobs[id]
	if !ok {
		return
	}

	job.State = state
	job.Stage = stage
	job.Current = current
	job.Total = total
	job.Message = msg
	job.UpdatedAt = time.Now().UTC()
}

// CompleteJob marca un job como completado
func (m *Manager) CompleteJob(id string, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	job, ok := m.jobs[id]
	if !ok {
		return
	}

	if err != nil {
		job.State = domain.JobStateFailed
		job.Error = err
	} else {
		job.State = domain.JobStateSucceeded
	}
	job.UpdatedAt = time.Now().UTC()
}

// CancelJob cancela un job
func (m *Manager) CancelJob(id string) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	job, ok := m.jobs[id]
	if !ok {
		return false
	}

	if job.State == domain.JobStateRunning || job.State == domain.JobStateQueued {
		job.Cancel()
		job.State = domain.JobStateCancelled
		job.UpdatedAt = time.Now().UTC()
		return true
	}

	return false
}

// CleanupOldJobs elimina jobs antiguos
func (m *Manager) CleanupOldJobs(maxAge time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	cutoff := time.Now().Add(-maxAge)
	for id, job := range m.jobs {
		if job.UpdatedAt.Before(cutoff) && job.State != domain.JobStateRunning {
			delete(m.jobs, id)
		}
	}
}

// ListJobs lista todos los jobs activos
func (m *Manager) ListJobs() []*domain.Job {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]*domain.Job, 0, len(m.jobs))
	for _, job := range m.jobs {
		result = append(result, job)
	}
	return result
}
