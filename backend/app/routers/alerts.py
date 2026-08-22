from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..dependencies import require_roles
from ..schemas.alert import AlertResponse, AlertUpdate

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def _get_alert_or_404(alert_id: int, db: Session) -> models.Alert:
    alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()

    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found.",
        )

    return alert


@router.get("", response_model=list[AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).all()


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    return _get_alert_or_404(alert_id, db)


@router.patch("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: int,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_admin: models.Admin = Depends(require_roles("SUPER_ADMIN", "OPERATOR")),
):
    alert = _get_alert_or_404(alert_id, db)

    update_data = payload.model_dump(exclude_unset=True)

    if "acknowledged_by" in update_data and update_data["acknowledged_by"] is not None:
        admin = (
            db.query(models.Admin)
            .filter(models.Admin.admin_id == update_data["acknowledged_by"])
            .first()
        )

        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Admin {update_data['acknowledged_by']} not found.",
            )

    for field, value in update_data.items():
        setattr(alert, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Alert could not be updated due to a database constraint.",
        )

    db.refresh(alert)
    return alert
